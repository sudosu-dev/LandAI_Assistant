import { useState } from "react";
import styles from "./Tooltip.module.css";

/**
 * A component that displays a tooltip when its child is hovered.
 * @param {object} props
 * @param {React.ReactNode} props.children - The element to hover over.
 * @param {string} props.text - The text to display in the tooltip.
 */
export default function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && <div className={styles.tooltipText}>{text}</div>}
    </div>
  );
}
