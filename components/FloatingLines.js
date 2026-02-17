'use client';

import { useEffect, useRef } from 'react';

export default function FloatingLines() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let width, height;
        let mouseX = 0;
        let mouseY = 0;

        // Configuration
        const lines = [];
        const lineCount = 30; // Number of lines
        const noiseSpeed = 0.002; // Speed of wave movement
        const lineSpacing = 30; // Base vertical spacing
        const amplitude = 50; // Wave height

        class Line {
            constructor(y, index) {
                this.baseY = y;
                this.index = index;
                this.points = [];
                this.offset = Math.random() * 100;
                this.color = `rgba(255, 255, 255, ${0.03 + (index / lineCount) * 0.1})`; // Gradient opacity
            }

            init(w) {
                this.points = [];
                const pointCount = Math.ceil(w / 50) + 2;
                for (let i = 0; i < pointCount; i++) {
                    this.points.push({
                        x: i * 50,
                        y: this.baseY,
                        angle: (i * 0.2) + this.offset
                    });
                }
            }

            update(time) {
                this.points.forEach((point) => {
                    // Sine wave movement
                    point.angle += noiseSpeed;
                    const waveY = Math.sin(point.angle + time * 0.0005) * amplitude;

                    // Mouse interaction (repel)
                    const dx = point.x - mouseX;
                    const dy = (this.baseY + waveY) - mouseY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 300;
                    let interactY = 0;

                    if (distance < maxDist) {
                        const force = (maxDist - distance) / maxDist;
                        // Push away vertically
                        interactY = force * 100 * (dy > 0 ? 1 : -1);
                    }

                    point.y = this.baseY + waveY + interactY;
                });
            }

            draw(ctx) {
                ctx.beginPath();
                ctx.strokeStyle = this.color;

                // Smooth curve through points
                if (this.points.length > 0) {
                    ctx.moveTo(this.points[0].x, this.points[0].y);
                    for (let i = 0; i < this.points.length - 1; i++) {
                        const p0 = this.points[i];
                        const p1 = this.points[i + 1];
                        const cpX = (p0.x + p1.x) / 2;
                        const cpY = (p0.y + p1.y) / 2;
                        ctx.quadraticCurveTo(p0.x, p0.y, cpX, cpY);
                    }
                    // Connect to last point
                    const last = this.points[this.points.length - 1];
                    ctx.lineTo(last.x, last.y);
                }

                ctx.stroke();
            }
        }

        const init = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;

            lines.length = 0;
            // Spread lines across the screen, mostly in the middle/bottom half for the "floor" effect or just general background
            // The user wants "Floating Lines", usually horizontal waves.
            const startY = height * 0.2; // Start 20% down
            const totalHeight = height * 0.8; // Cover 80%

            for (let i = 0; i < lineCount; i++) {
                lines.push(new Line(startY + (i * (totalHeight / lineCount)), i));
                lines[i].init(width);
            }
        };

        const render = (time) => {
            ctx.clearRect(0, 0, width, height);

            lines.forEach(line => {
                line.update(time);
                line.draw(ctx);
            });

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            init();
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        init();
        render(0);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
            style={{ filter: 'blur(1px)' }} // Slight blur for nicer "glow" effect
        />
    );
}
