import styles from "./Button.module.css";

/**
 * A reusable button component.
 * @param {object} props - The component's props.
 * @param {Function} props.onClick - The function to execute on click.
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {string} [props.type='button'] - The button's type attribute.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 */
export default function Button({
  onClick,
  children,
  type = "button",
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
