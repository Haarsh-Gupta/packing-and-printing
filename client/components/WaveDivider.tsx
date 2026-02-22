"use client";

interface WaveDividerProps {
    topColor?: string;
    bottomColor?: string;
    variant?: "smooth" | "jagged" | "blob";
    flip?: boolean;
}

export default function WaveDivider({
    topColor = "white",
    bottomColor = "white",
    variant = "smooth",
    flip = false,
}: WaveDividerProps) {
    const paths = {
        smooth: (
            <>
                <path
                    d="M0 40C120 80 240 0 360 40C480 80 600 0 720 40C840 80 960 0 1080 40C1200 80 1320 0 1440 40V120H0V40Z"
                    fill={bottomColor}
                    className="animate-wave-1"
                />
                <path
                    d="M0 60C160 20 320 100 480 60C640 20 800 100 960 60C1120 20 1280 100 1440 60V120H0V60Z"
                    fill={bottomColor}
                    opacity="0.5"
                    className="animate-wave-2"
                />
            </>
        ),
        jagged: (
            <>
                <path
                    d="M0 50L60 30L120 60L180 20L240 55L300 25L360 50L420 15L480 45L540 20L600 55L660 30L720 50L780 15L840 45L900 25L960 55L1020 20L1080 50L1140 30L1200 55L1260 20L1320 50L1380 25L1440 45V120H0V50Z"
                    fill={bottomColor}
                    className="animate-wave-1"
                />
            </>
        ),
        blob: (
            <>
                <path
                    d="M0 80C180 30 300 90 480 50C660 10 780 70 960 40C1140 10 1260 80 1440 50V120H0V80Z"
                    fill={bottomColor}
                    className="animate-wave-1"
                />
                <path
                    d="M0 90C200 50 400 100 600 70C800 40 1000 90 1200 60C1300 45 1400 80 1440 70V120H0V90Z"
                    fill={bottomColor}
                    opacity="0.3"
                    className="animate-wave-2"
                />
            </>
        ),
    };

    return (
        <div
            className="relative w-full overflow-hidden leading-none"
            style={{
                backgroundColor: topColor,
                marginTop: "-1px",
                marginBottom: "-1px",
            }}
        >
            <svg
                viewBox="0 0 1440 120"
                preserveAspectRatio="none"
                className={`w-full h-16 md:h-20 block ${flip ? "rotate-180" : ""}`}
            >
                {paths[variant]}
            </svg>

            <style jsx>{`
                @keyframes wave-drift-1 {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(-30px); }
                    100% { transform: translateX(0); }
                }
                @keyframes wave-drift-2 {
                    0% { transform: translateX(0); }
                    50% { transform: translateX(30px); }
                    100% { transform: translateX(0); }
                }
                .animate-wave-1 {
                    animation: wave-drift-1 6s ease-in-out infinite;
                }
                .animate-wave-2 {
                    animation: wave-drift-2 8s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
