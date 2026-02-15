import { PresetConfig } from "react-native-animated-glow";



export const appleIntelli: PresetConfig = {
    states: [
        {
            name: "default",
            preset: {
                cornerRadius: 50,
                outlineWidth: 0,
                borderColor: "rgba(255, 255, 255, 1)",
                backgroundColor: "#000000",
                animationSpeed: 1,
                borderSpeedMultiplier: 1,
                glowLayers: [
                    {
                        glowPlacement: "inside",
                        colors: ["#0000ff", "#ff0080", "#ff0000", "#ffa500"],
                        glowSize: [24],
                        opacity: 0.3,
                        speedMultiplier: 1,
                        coverage: 1
                    },
                    {
                        glowPlacement: "inside",
                        colors: ["#191970", "#ff0080", "#ff0000", "#ffa500"],
                        glowSize: [6],
                        opacity: 0.5,
                        speedMultiplier: 1,
                        coverage: 1
                    },
                    {
                        glowPlacement: "inside",
                        colors: ["#ffffff", "#ff0080", "#ff4d4d", "#ffcc99"],
                        glowSize: [1],
                        opacity: 1,
                        speedMultiplier: 1,
                        coverage: 1
                    },
                    {
                        glowPlacement: "inside",
                        colors: ["#6699ff", "#add8e6"],
                        glowSize: [0, 4, 4, 0],
                        opacity: 0.2,
                        speedMultiplier: 2,
                        coverage: 0.4
                    },
                    {
                        glowPlacement: "inside",
                        colors: ["#ffffff"],
                        glowSize: [0, 2, 0],
                        opacity: 0.2,
                        speedMultiplier: 2,
                        coverage: 0.4
                    }
                ]
            }
        },
        {
            name: "hover",
            transition: 300,
            preset: {
                animationSpeed: 1.5,
                glowLayers: [
                    { glowSize: [29], opacity: 0.36 },
                    { glowSize: [7], opacity: 0.6 },
                    { glowSize: [1], opacity: 1 },
                    { glowSize: [0, 5, 5, 0], opacity: 0.24 },
                    { glowSize: [0, 2, 0], opacity: 0.24 }
                ]
            }
        },
        {
            name: "press",
            transition: 100,
            preset: {
                animationSpeed: 2,
                glowLayers: [
                    { glowSize: [34], opacity: 0.42 },
                    { glowSize: [8], opacity: 0.7 },
                    { glowSize: [1], opacity: 1 },
                    { glowSize: [0, 6, 6, 0], opacity: 0.28 },
                    { glowSize: [0, 3, 0], opacity: 0.28 }
                ]
            }
        }
    ]
};