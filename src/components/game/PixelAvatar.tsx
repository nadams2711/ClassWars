"use client";

import { cn } from "@/lib/utils";

// 10x10 pixel art sprites with multi-color support
// 0=transparent, 1=main color, 2=dark (#111), 3=white
const PIXEL_SPRITES: { name: string; rows: string[] }[] = [
  {
    name: "Banana",
    rows: [
      "0000002000",
      "0000021000",
      "0000110000",
      "0001110000",
      "0011100000",
      "0011100000",
      "0011100000",
      "0001110000",
      "0000211000",
      "0000020000",
    ],
  },
  {
    name: "Fish",
    rows: [
      "0000000000",
      "0000110000",
      "0001111100",
      "0011111110",
      "1011321110",
      "1011111110",
      "0011111110",
      "0001111100",
      "0000110000",
      "0000000000",
    ],
  },
  {
    name: "Taco",
    rows: [
      "0000000000",
      "0011111100",
      "0111111110",
      "1131213111",
      "1113121311",
      "1131213111",
      "0111111110",
      "0011111100",
      "0001111000",
      "0000000000",
    ],
  },
  {
    name: "Ghost",
    rows: [
      "0001111000",
      "0011111100",
      "0111111110",
      "0132013210",
      "0111111110",
      "0111111110",
      "0111111110",
      "0111111110",
      "0101101010",
      "0000000000",
    ],
  },
  {
    name: "Poop",
    rows: [
      "0000110000",
      "0001101000",
      "0000111100",
      "0011111100",
      "0111111110",
      "0132013210",
      "0111111110",
      "0111001110",
      "0111111110",
      "0000000000",
    ],
  },
  {
    name: "Pizza",
    rows: [
      "0000110000",
      "0000111000",
      "0001121000",
      "0001111100",
      "0011211100",
      "0011111110",
      "0111121110",
      "0111111111",
      "1222222222",
      "0000000000",
    ],
  },
  {
    name: "Cactus",
    rows: [
      "0000110000",
      "0000110000",
      "0100110010",
      "0110110110",
      "0110110110",
      "0111111110",
      "0001111000",
      "0001111000",
      "0001111000",
      "0022222200",
    ],
  },
  {
    name: "Alien",
    rows: [
      "0011111100",
      "0111111110",
      "1111111111",
      "1122001221",
      "1132201321",
      "0111111111",
      "0011221100",
      "0001111000",
      "0010000100",
      "0100000010",
    ],
  },
  {
    name: "Donut",
    rows: [
      "0000000000",
      "0021312100",
      "0131111310",
      "1113111311",
      "1110000111",
      "1110000111",
      "1111111111",
      "0111111110",
      "0011111100",
      "0000000000",
    ],
  },
  {
    name: "Frog",
    rows: [
      "0320000320",
      "1331001331",
      "0111111110",
      "0111111110",
      "0111111110",
      "0111111110",
      "0110222010",
      "0011111100",
      "0011001100",
      "0000000000",
    ],
  },
  {
    name: "Robot",
    rows: [
      "0000330000",
      "0022222200",
      "0021111200",
      "0013101310",
      "0021111200",
      "0021221200",
      "0002222000",
      "0021111200",
      "0022222200",
      "0021001200",
    ],
  },
  {
    name: "Skull",
    rows: [
      "0011111100",
      "0111111110",
      "1111111111",
      "1122012211",
      "1132013211",
      "1111111111",
      "0111111110",
      "0013131310",
      "0011111100",
      "0000000000",
    ],
  },
  {
    name: "Burger",
    rows: [
      "0011111100",
      "0111111110",
      "1111111111",
      "1333333331",
      "2222222222",
      "1111111111",
      "1131113111",
      "2222222222",
      "0111111110",
      "0000000000",
    ],
  },
  {
    name: "Cat",
    rows: [
      "1100000011",
      "1110000111",
      "1111111111",
      "0132013210",
      "0111111110",
      "0111211110",
      "0110110110",
      "0011111100",
      "0001111000",
      "0000000000",
    ],
  },
  {
    name: "Mushroom",
    rows: [
      "0001111000",
      "0013111310",
      "0111311110",
      "1113111131",
      "1111111111",
      "0033333300",
      "0003333000",
      "0003333000",
      "0003333000",
      "0000000000",
    ],
  },
  {
    name: "UFO",
    rows: [
      "0001111000",
      "0011331100",
      "0011331100",
      "0001111000",
      "1111111111",
      "1112112111",
      "0111111110",
      "0001001000",
      "0000000000",
      "0000000000",
    ],
  },
  {
    name: "Octopus",
    rows: [
      "0011111100",
      "0111111110",
      "0132013210",
      "0111111110",
      "0111221110",
      "0111111110",
      "0111111110",
      "1011101110",
      "1010101010",
      "0000000000",
    ],
  },
  {
    name: "Penguin",
    rows: [
      "0001111000",
      "0011111100",
      "0111111110",
      "0132013210",
      "1111111111",
      "1113333111",
      "0113333110",
      "0013333100",
      "0011111100",
      "0001201200",
    ],
  },
  {
    name: "Devil",
    rows: [
      "1100000011",
      "0110000110",
      "0011111100",
      "0111111110",
      "0132013210",
      "0111111110",
      "0112222110",
      "0011111100",
      "0001001000",
      "0000000000",
    ],
  },
  {
    name: "Avocado",
    rows: [
      "0001111000",
      "0011111100",
      "0111111110",
      "0111111110",
      "0111221110",
      "0112222110",
      "0112222110",
      "0111221110",
      "0011111100",
      "0001111000",
    ],
  },
  {
    name: "Dino",
    rows: [
      "0000111000",
      "0001111100",
      "0001311100",
      "0001111000",
      "1001111000",
      "1101111100",
      "0111111110",
      "0011110000",
      "0001001000",
      "0011001100",
    ],
  },
  {
    name: "Bomb",
    rows: [
      "0000033000",
      "0000011000",
      "0001111000",
      "0011111100",
      "0131111110",
      "0111111110",
      "0111111110",
      "0011111100",
      "0001111000",
      "0000000000",
    ],
  },
  {
    name: "Cupcake",
    rows: [
      "0000130000",
      "0001111000",
      "0013131310",
      "0111111110",
      "0111311110",
      "0011111100",
      "0022222200",
      "0021112100",
      "0022222200",
      "0022222200",
    ],
  },
  {
    name: "Panda",
    rows: [
      "2210000122",
      "2211111122",
      "0111111110",
      "0123013210",
      "0132013210",
      "0111111110",
      "0011221100",
      "0001111000",
      "0001001000",
      "0000000000",
    ],
  },
];

export { PIXEL_SPRITES };

const AVATAR_COLORS = [
  "#FFD700", // Banana - gold
  "#00D4FF", // Fish - cyan
  "#FF8C00", // Taco - warm orange
  "#B8A8FF", // Ghost - lavender
  "#A67C52", // Poop - brown
  "#FFAA33", // Pizza - golden cheese
  "#32CD32", // Cactus - lime green
  "#39FF14", // Alien - neon green
  "#FF69B4", // Donut - hot pink
  "#22BB55", // Frog - green
  "#88AACC", // Robot - steel blue
  "#DDDDE8", // Skull - bone white
  "#DD8833", // Burger - warm brown
  "#FF9944", // Cat - orange tabby
  "#FF3333", // Mushroom - red cap
  "#99AABB", // UFO - silver
  "#DD5588", // Octopus - coral pink
  "#445566", // Penguin - dark slate
  "#FF2222", // Devil - red
  "#77BB33", // Avocado - green
  "#44AA88", // Dino - teal
  "#555566", // Bomb - dark gray
  "#FF88AA", // Cupcake - pastel pink
  "#CCCCDD", // Panda - light gray
];

export { AVATAR_COLORS as PIXEL_AVATAR_COLORS };

const DARK_COLOR = "#111122";
const WHITE_COLOR = "#FFFFFF";

const COLOR_MAP: Record<string, (main: string) => string> = {
  "0": () => "transparent",
  "1": (main) => main,
  "2": () => DARK_COLOR,
  "3": () => WHITE_COLOR,
};

interface PixelAvatarProps {
  avatarIndex: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const GRID_SIZE = 10;
const CELL_SIZES = { sm: 3, md: 4, lg: 6, xl: 8 };

export function PixelAvatar({ avatarIndex, size = "md", className }: PixelAvatarProps) {
  const idx = ((avatarIndex % PIXEL_SPRITES.length) + PIXEL_SPRITES.length) % PIXEL_SPRITES.length;
  const sprite = PIXEL_SPRITES[idx];
  const color = AVATAR_COLORS[idx];
  const cellSize = CELL_SIZES[size];
  const totalSize = cellSize * GRID_SIZE;

  return (
    <div
      className={cn("shrink-0", className)}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, ${cellSize}px)`,
        width: totalSize,
        height: totalSize,
        imageRendering: "pixelated",
      }}
      title={sprite.name}
    >
      {sprite.rows.map((row, y) =>
        row.split("").map((cell, x) => (
          <div
            key={`${y}-${x}`}
            style={{
              backgroundColor: (COLOR_MAP[cell] || COLOR_MAP["0"])(color),
            }}
          />
        ))
      )}
    </div>
  );
}

export function getSpriteName(avatarIndex: number): string {
  const idx = ((avatarIndex % PIXEL_SPRITES.length) + PIXEL_SPRITES.length) % PIXEL_SPRITES.length;
  return PIXEL_SPRITES[idx].name;
}

export function getAvatarColor(avatarIndex: number): string {
  const idx = ((avatarIndex % AVATAR_COLORS.length) + AVATAR_COLORS.length) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}
