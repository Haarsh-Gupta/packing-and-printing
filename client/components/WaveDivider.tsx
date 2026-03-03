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
                <g>
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="8s" repeatCount="indefinite" />
                    <path
                        d="M0 40 C120 80 240 0 360 40 C480 80 600 0 720 40 C840 80 960 0 1080 40 C1200 80 1320 0 1440 40 C1560 80 1680 0 1800 40 C1920 80 2040 0 2160 40 C2280 80 2400 0 2520 40 C2640 80 2760 0 2880 40 V120 H0 Z"
                        fill={bottomColor}
                    />
                </g>
                <g opacity="0.5">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="12s" repeatCount="indefinite" />
                    <path
                        d="M0 60 C160 20 320 100 480 60 C640 20 800 100 960 60 C1120 20 1280 100 1440 60 C1600 20 1760 100 1920 60 C2080 20 2240 100 2400 60 C2560 20 2720 100 2880 60 V120 H0 Z"
                        fill={bottomColor}
                    />
                </g>
            </>
        ),
        jagged: (
            <>
                <g>
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="10s" repeatCount="indefinite" />
                    <path
                        d="M0 50L60 30L120 60L180 20L240 55L300 25L360 50L420 15L480 45L540 20L600 55L660 30L720 50L780 15L840 45L900 25L960 55L1020 20L1080 50L1140 30L1200 55L1260 20L1320 50L1380 25L1440 50L1500 30L1560 60L1620 20L1680 55L1740 25L1800 50L1860 15L1920 45L1980 20L2040 55L2100 30L2160 50L2220 15L2280 45L2340 25L2400 55L2460 20L2520 50L2580 30L2640 55L2700 20L2760 50L2820 25L2880 50V120H0Z"
                        fill={bottomColor}
                    />
                </g>
            </>
        ),
        blob: (
            <>
                <g>
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="15s" repeatCount="indefinite" />
                    <path
                        d="M0 60 C180 10 300 110 480 60 C660 10 780 110 960 60 C1140 10 1260 110 1440 60 C1620 10 1740 110 1920 60 C2100 10 2220 110 2400 60 C2580 10 2700 110 2880 60 V120 H0 Z"
                        fill={bottomColor}
                    />
                </g>
                <g opacity="0.3">
                    <animateTransform attributeName="transform" type="translate" from="0 0" to="-1440 0" dur="20s" repeatCount="indefinite" />
                    <path
                        d="M0 80 C200 40 400 120 600 80 C800 40 1000 120 1200 80 C1300 60 1400 100 1440 80 C1640 40 1840 120 2040 80 C2240 40 2440 120 2640 80 C2740 60 2840 100 2880 80 V120 H0 Z"
                        fill={bottomColor}
                    />
                </g>
            </>
        ),
    };

    return (
        <div
            className="relative w-full overflow-hidden leading-none z-10"
            style={{
                backgroundColor: topColor,
                marginTop: "-1px",
                marginBottom: "-1px",
            }}
        >
            <svg
                viewBox="0 0 2880 120"
                preserveAspectRatio="none"
                className={`w-[200%] min-w-[200%] h-16 md:h-20 block ${flip ? "-scale-y-100" : ""}`}
            >
                {paths[variant]}
            </svg>
        </div>
    );
}
