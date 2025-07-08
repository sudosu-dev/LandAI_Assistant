import { useState, useEffect } from "react";
import styles from "./AnalysisModal.module.css";
import Button from "../Button/Button";

export default function AnalysisModal({
  isOpen,
  onClose,
  onSubmit,
  initialContext,
}) {
  const [marketContext, setMarketContext] = useState({
    oilPrice: 75,
    gasPrice: 2.75,
    drillingCost: 10000000,
  });

  useEffect(() => {
    if (initialContext) {
      setMarketContext(initialContext);
    }
  }, [initialContext]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMarketContext((prev) => ({
      ...prev,
      [name]: value === "" ? "" : parseFloat(value),
    }));
  };

  const handleSubmit = (e) => {
    console.log("Analysis Modal form submitted!");

    e.preventDefault();
    const finalContext = {
      oilPrice: parseFloat(marketContext.oilPrice) || 0,
      gasPrice: parseFloat(marketContext.gasPrice) || 0,
      drillingCost: parseFloat(marketContext.drillingCost) || 0,
    };
    onSubmit(finalContext);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>Re-run Analysis with Custom Values</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="oilPrice">WTI Oil Price ($/barrel)</label>
            <input
              type="number"
              id="oilPrice"
              name="oilPrice"
              value={marketContext.oilPrice}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gasPrice">Henry Hub Gas Price ($/MMBtu)</label>
            <input
              type="number"
              id="gasPrice"
              name="gasPrice"
              value={marketContext.gasPrice}
              onChange={handleChange}
              step="0.01"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="drillingCost">Drilling & Completion Cost ($)</label>
            <input
              type="number"
              id="drillingCost"
              name="drillingCost"
              value={marketContext.drillingCost}
              onChange={handleChange}
              step="100000"
            />
          </div>
          <div className={styles.buttonGroup}>
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Run Analysis</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
