"use client";

import { useState, useEffect, type CSSProperties } from "react";
import styles from "./AnimatedWord.module.css";

const WORDS = ["모니", "moni", "우리", "AI"];
const CHAR_DELAY_MS = 55;
const INTERVAL_MS = 5000;

export function AnimatedWord() {
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
      setAnimKey((prev) => prev + 1);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const word = WORDS[index];

  return (
    <span className={styles.wordWrap} aria-label={word}>
      {word.split("").map((char, i) => (
        <span
          key={`${animKey}-${i}`}
          className={styles.char}
          style={{ "--char-delay": `${i * CHAR_DELAY_MS}ms` } as CSSProperties}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
