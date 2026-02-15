import { PresetConfig } from "react-native-animated-glow";

export const abyssalGlow: PresetConfig = {
    "states": [
        {
            "name": "default",
            "preset": {
                "cornerRadius": 40,
                "outlineWidth": 3,
                "borderColor": [
                    "rgba(2, 62, 138, 1)",
                    "rgba(0, 180, 216, 1)",
                    "rgba(129, 236, 236, 1)",
                    "rgba(0, 0, 0, 1)",
                    "rgba(0, 0, 0, 1)",
                    "rgba(0, 0, 0, 1)",
                    "rgba(0, 0, 0, 1)"
                ],
                "backgroundColor": "rgba(0, 0, 0, 1)",
                "animationSpeed": 2,
                "borderSpeedMultiplier": 1,
                "glowLayers": [
                    {
                        "colors": [
                            "rgba(2, 62, 138, 1)",
                            "rgba(0, 180, 216, 1)",
                            "rgba(129, 236, 236, 1)",
                            "rgba(72, 202, 228, 1)"
                        ],
                        "opacity": 0.3,
                        "glowSize": [
                            0,
                            4
                        ],
                        "speedMultiplier": 1,
                        "scaleAmplitude": 0,
                        "scaleFrequency": 2.5,
                        "glowPlacement": "behind",
                        "coverage": 0.7,
                        "relativeOffset": 0.15
                    },
                    {
                        "colors": [
                            "rgba(2, 62, 138, 1)",
                            "rgba(0, 180, 216, 1)",
                            "rgba(129, 236, 236, 1)",
                            "rgba(72, 202, 228, 1)"
                        ],
                        "opacity": 0.05,
                        "glowSize": [
                            0,
                            20
                        ],
                        "speedMultiplier": 1,
                        "scaleAmplitude": 0,
                        "scaleFrequency": 2.5,
                        "glowPlacement": "behind",
                        "coverage": 0.75,
                        "relativeOffset": 0.2
                    }
                ]
            }
        },
        {
            "name": "hover",
            "transition": 300,
            "preset": {
                "animationSpeed": 3,
                "glowLayers": [
                    {
                        "glowSize": [
                            0,
                            5
                        ],
                        "opacity": 0.36
                    },
                    {
                        "glowSize": [
                            0,
                            24
                        ],
                        "opacity": 0.06
                    }
                ]
            }
        },
        {
            "name": "press",
            "transition": 100,
            "preset": {
                "animationSpeed": 4,
                "glowLayers": [
                    {
                        "glowSize": [
                            0,
                            6
                        ],
                        "opacity": 0.42
                    },
                    {
                        "glowSize": [
                            0,
                            28
                        ],
                        "opacity": 0.07
                    }
                ]
            }
        }
    ]
};