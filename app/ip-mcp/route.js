import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IP_MCP_KEY = "primary";

function jsonResponse(payload, status = 200) {
    return NextResponse.json(payload, {
        status,
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
        },
    });
}

function getRequestIp(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
        const forwardedIp = forwardedFor.split(",")[0]?.trim();
        if (forwardedIp) {
            return forwardedIp;
        }
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp.trim();
    }

    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) {
        return cfIp.trim();
    }

    return null;
}

async function readOptionalJson(request) {
    const rawBody = await request.text();
    if (!rawBody) {
        return {};
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        throw new Error("INVALID_JSON");
    }
}

function getWriteToken(request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }

    return request.headers.get("x-ip-mcp-token")?.trim() || null;
}

function serializeRecord(record) {
    return {
        ip: record?.currentIp ?? null,
        reportedBy: record?.reportedBy ?? null,
        sourceIp: record?.sourceIp ?? null,
        userAgent: record?.userAgent ?? null,
        lastUpdated: record?.updatedAt?.toISOString() ?? null,
        createdAt: record?.createdAt?.toISOString() ?? null,
    };
}

export async function GET() {
    try {
        const record = await prisma.ipMcpState.findUnique({
            where: { key: IP_MCP_KEY },
        });

        return jsonResponse(serializeRecord(record));
    } catch (error) {
        console.error("[IP_MCP_GET]", error);
        return jsonResponse({ error: "Failed to fetch IP" }, 500);
    }
}

export async function POST(request) {
    const requiredToken = process.env.IP_MCP_WRITE_TOKEN;
    if (requiredToken && getWriteToken(request) !== requiredToken) {
        return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body;

    try {
        body = await readOptionalJson(request);
    } catch (error) {
        if (error.message === "INVALID_JSON") {
            return jsonResponse({ error: "Invalid JSON body" }, 400);
        }

        console.error("[IP_MCP_POST_BODY]", error);
        return jsonResponse({ error: "Failed to read request body" }, 500);
    }

    const reportedIp = typeof body.ip === "string" ? body.ip.trim() : "";
    const detectedIp = getRequestIp(request);
    const ip = reportedIp || detectedIp;

    if (!ip) {
        return jsonResponse({ error: "IP is required in body or request headers" }, 400);
    }

    if (!isIP(ip)) {
        return jsonResponse({ error: "Invalid IP address" }, 400);
    }

    const reportedBy = typeof body.reportedBy === "string" ? body.reportedBy.trim() : "";
    const userAgent = request.headers.get("user-agent")?.trim() || null;

    try {
        const record = await prisma.ipMcpState.upsert({
            where: { key: IP_MCP_KEY },
            update: {
                currentIp: ip,
                reportedBy: reportedBy || null,
                sourceIp: detectedIp,
                userAgent,
            },
            create: {
                key: IP_MCP_KEY,
                currentIp: ip,
                reportedBy: reportedBy || null,
                sourceIp: detectedIp,
                userAgent,
            },
        });

        return jsonResponse({
            message: "IP updated successfully",
            ...serializeRecord(record),
        });
    } catch (error) {
        console.error("[IP_MCP_POST]", error);
        return jsonResponse({ error: "Failed to update IP" }, 500);
    }
}
