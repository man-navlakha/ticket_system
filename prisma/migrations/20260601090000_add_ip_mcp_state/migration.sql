CREATE TABLE "IpMcpState" (
    "key" TEXT NOT NULL DEFAULT 'primary',
    "currentIp" TEXT NOT NULL,
    "reportedBy" TEXT,
    "sourceIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpMcpState_pkey" PRIMARY KEY ("key")
);
