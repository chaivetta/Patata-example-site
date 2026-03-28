/* =============================================
   PROFESSIONAL THEATER CURTAIN ENGINE v2.1
   Dual-layer, physics-based gathering, dynamic lighting
   Final Polish: Fade-out & Exit
   ============================================= */

(function () {
    const container = document.getElementById('curtain-container');
    const canvas = document.getElementById('curtain-canvas');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });

    // === CONFIGURATION ===
    const CONFIG = {
        frontColor: { r: 90, g: 0, b: 0 },    // Rich Red
        backColor: { r: 40, g: 0, b: 0 },     // Dark Red
        foldCount: 12,
        waveSpeed: 0.02,
        openDuration: 3000,
        goldTrimWidth: 8
    };

    // State
    let W, H;
    let opening = false;
    let openProgress = 0;
    let globalTime = 0;
    let startTime = null;
    let animDone = false;

    // Resize
    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Easing: cubic-bezier(.65, 0, .35, 1) approx
    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    // ─── Render Single Layer ───
    function renderLayer(side, layer) {
        const isLeft = side === 'left';
        const isFront = layer === 'front';

        // easing
        let ease = easeInOutCubic(openProgress);

        // Parallax: Back layer lags behind (0.7x speed)
        if (!isFront) {
            ease *= 0.85;
        }

        // Geometry Config
        // Curtain width shrinks as it opens (gathering)
        // Starts at W/2. Ends at ~W/5.
        const startW = W / 2;
        const gatherRatio = 1 - (ease * 0.6); // 1.0 -> 0.4
        const currentW = startW * gatherRatio;

        // Position of INNER edge
        // Move ~1.2x further to clear screen completely
        const center = W / 2;
        let innerX;

        // Extended movement range (120% of half-width)
        const moveDist = center * ease * 1.2;

        if (isLeft) {
            innerX = center - moveDist; // Move left, past 0
        } else {
            innerX = center + moveDist; // Move right, past W
        }

        // Outer Edge X (Fixed)
        // Actually, let outer edge move slightly too for realism
        let outerX;
        const outerMove = (W * 0.1) * ease; // Pull outer edge slightly offscreen

        if (isLeft) outerX = 0 - outerMove;
        else outerX = W + outerMove;

        // Divide into strip points
        const N = CONFIG.foldCount;
        const points = [];

        for (let i = 0; i <= N; i++) {
            const t = i / N; // 0..1
            let x;
            if (isLeft) {
                x = outerX + (t * (innerX - outerX));
            } else {
                x = innerX + (t * (outerX - innerX));
            }
            points.push({ x, y: 0 });
        }

        // Draw Folds
        const phaseOffset = isFront ? 0 : 2.5;
        const baseAmp = isFront ? 15 : 25;
        const amp = baseAmp * (1 + ease * 2.5); // Increase wave amplitude
        const seed = isLeft ? 0 : 5;

        const baseR = isFront ? CONFIG.frontColor.r : CONFIG.backColor.r;

        for (let i = 0; i < N; i++) {
            const pt1 = points[i];
            const pt2 = points[i + 1];
            if (!pt2) continue;

            // Lighting based on fold index + time
            const midT = (i + 0.5) / N;
            const sineVal = Math.sin((midT * Math.PI * 2 * 2) + globalTime + phaseOffset + seed);
            const light = 0.5 + (0.5 * sineVal); // 0..1

            const rVal = Math.floor(Math.max(0, Math.min(255, baseR + (light * 50 - 25))));

            // Determine if this strip is the INNER EDGE (gap side)
            const isInnerEdge = isLeft ? (i === N - 1) : (i === 0);

            // Draw Strip
            ctx.beginPath();
            ctx.moveTo(pt1.x, 0);

            // Top Right
            ctx.lineTo(pt2.x, 0);

            const getWaveX = (gx, y) => {
                const yNorm = y / H;
                const wave = Math.sin((midT * Math.PI * 2 * 2) + (yNorm * 3) + globalTime + phaseOffset + seed);
                return gx + (wave * amp * yNorm); // Amplitude grows towards bottom
            };

            // Draw Right Side
            if (isLeft && isInnerEdge) {
                // Detailed wave down
                for (let y = 0; y <= H; y += 10) {
                    ctx.lineTo(getWaveX(pt2.x, y), y);
                }
            } else {
                ctx.lineTo(getWaveX(pt2.x, H), H);
            }

            // Bottom Edge
            ctx.lineTo(getWaveX(pt1.x, H), H);

            // Left Edge (Vertical)
            if (!isLeft && isInnerEdge) {
                // Detailed wave up
                for (let y = H; y >= 0; y -= 10) {
                    ctx.lineTo(getWaveX(pt1.x, y), y);
                }
            } else {
                ctx.lineTo(pt1.x, 0);
            }

            ctx.closePath();

            // Gradient Fill
            const grd = ctx.createLinearGradient(pt1.x, 0, pt2.x, 0);
            grd.addColorStop(0, `rgb(${rVal - 30},0,0)`);
            grd.addColorStop(0.5, `rgb(${rVal + 30},0,0)`);
            grd.addColorStop(1, `rgb(${rVal - 30},0,0)`);
            ctx.fillStyle = grd;
            ctx.fill();

            // ─── GOLD TRIM (Front layer, Inner edge only) ───
            if (isFront && isInnerEdge) {
                const trimXBase = isLeft ? pt2.x : pt1.x;

                ctx.beginPath();
                ctx.moveTo(trimXBase, 0);
                for (let y = 0; y <= H; y += 10) {
                    ctx.lineTo(getWaveX(trimXBase, y), y);
                }

                ctx.strokeStyle = `rgba(255,215,0, ${1 - ease * 0.3})`; // Reduce alpha
                ctx.lineWidth = CONFIG.goldTrimWidth * (1 - ease * 0.5);
                ctx.lineCap = 'round';
                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 15;
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
    }

    // ─── Main Loop ───
    function loop(timestamp) {
        if (!startTime) startTime = timestamp;

        // Time
        if (opening) {
            const elapsed = timestamp - startTime;
            openProgress = Math.min(1, elapsed / CONFIG.openDuration);
        }
        globalTime += CONFIG.waveSpeed;

        // 1. Clear Canvas
        ctx.clearRect(0, 0, W, H);

        // 2. Fade Out logic (last 20%)
        ctx.save();
        if (openProgress > 0.8) {
            const fade = 1 - ((openProgress - 0.8) / 0.2); // 1 -> 0
            ctx.globalAlpha = Math.max(0, fade);
        }

        // 3. Draw Back Layer
        renderLayer('left', 'back');
        renderLayer('right', 'back');

        // 4. Draw Front Layer
        renderLayer('left', 'front');
        renderLayer('right', 'front');

        ctx.restore();

        // 5. Check End
        if (openProgress >= 1 && !animDone) {
            animDone = true;
            setTimeout(() => {
                container.classList.add('hidden');
                document.body.classList.remove('loading');
                document.querySelectorAll('.hero .fade-up').forEach((el, i) => {
                    setTimeout(() => el.classList.add('visible'), i * 200);
                });
            }, 50); // Faster removal
        }

        if (!animDone || openProgress < 1) {
            requestAnimationFrame(loop);
        }
    }

    // ─── Events ───
    const btn = document.getElementById('curtainButton');
    if (btn) {
        btn.addEventListener('click', () => {
            if (opening) return;
            opening = true;
            startTime = performance.now();
            container.classList.add('opening'); // CSS: opacity 0 for overlay

            // Music
            const musicFiles = [
                'music/müsic 1.mp3',
                'music/müsic 2.mp3',
                'music/music 3.mp3',
                'music/music 4.mp3',
                'music/music 5.mp3',
                'music/müsic 6.mp3',
                'music/müsic 7.mp3',
                'music/müsic 8.mp3',
                'music/müsic 9.mp3'
            ];
            const bgMusic = document.getElementById('bgMusic');
            if (bgMusic) {
                const randomTrack = musicFiles[Math.floor(Math.random() * musicFiles.length)];
                bgMusic.src = randomTrack;
                bgMusic.volume = 0.4;
                bgMusic.play().catch(e => console.warn('Audio play failed', e));
            }
        });
    }

    // Start
    requestAnimationFrame(loop);

})();
