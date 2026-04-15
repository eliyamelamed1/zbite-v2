import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Square, CheckSquare, X } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getShoppingList,
  toggleShoppingItem,
  removeShoppingItem,
  clearShoppingList,
} from '../../features/shopping-list/api/shopping-list';
import SEO from '../../components/(ui)/seo/SEO/SEO';
import styles from './ShoppingList.module.css';

import type { ShoppingItem } from '../../features/shopping-list/api/shopping-list';

/** Shopping list page — checklist UI for grocery shopping. */
export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getShoppingList();
      setItems(res.data.shoppingList.items);
    } catch {
      toast.error('Failed to load shopping list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item._id === itemId ? { ...item, isChecked } : item)),
    );
    try {
      await toggleShoppingItem(itemId, isChecked);
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((item) => (item._id === itemId ? { ...item, isChecked: !isChecked } : item)),
      );
      toast.error('Failed to update item');
    }
  };

  const handleRemove = async (itemId: string) => {
    const removed = items.find((i) => i._id === itemId);
    setItems((prev) => prev.filter((i) => i._id !== itemId));
    try {
      await removeShoppingItem(itemId);
    } catch {
      if (removed) setItems((prev) => [...prev, removed]);
      toast.error('Failed to remove item');
    }
  };

  const handleClearAll = async () => {
    const backup = [...items];
    setItems([]);
    try {
      await clearShoppingList();
      toast.success('Shopping list cleared');
    } catch {
      setItems(backup);
      toast.error('Failed to clear list');
    }
  };

  const uncheckedItems = items.filter((i) => !i.isChecked);
  const checkedItems = items.filter((i) => i.isChecked);

  if (loading) return <div className={styles.loading}>Loading shopping list...</div>;

  return (
    <div className={styles.page}>
      <SEO title="Shopping List" description="Your ingredient shopping list." noindex />
      <div className={styles.header}>
        <h1 className={styles.title}>Shopping List</h1>
        {items.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClearAll}>
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}><ShoppingCart size={32} /></span>
          <p className={styles.emptyText}>Your shopping list is empty</p>
          <p className={styles.emptyHint}>Add ingredients from any recipe to start building your list</p>
        </div>
      ) : (
        <>
          {/* Unchecked items */}
          <div className={styles.list}>
            {uncheckedItems.map((item) => (
              <div key={item._id} className={styles.item}>
                <button
                  className={styles.checkbox}
                  onClick={() => handleToggle(item._id, true)}
                  aria-label="Mark as bought"
                >
                  <Square size={18} />
                </button>
                <div className={styles.itemInfo}>
                  <span className={styles.itemAmount}>{item.amount}</span>
                  <span className={styles.itemName}>{item.name}</span>
                  {item.recipeTitle && (
                    <span className={styles.itemSource}>from {item.recipeTitle}</span>
                  )}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => handleRemove(item._id)}
                  aria-label="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Checked items */}
          {checkedItems.length > 0 && (
            <>
              <div className={styles.sectionLabel}>
                Bought ({checkedItems.length})
              </div>
              <div className={styles.list}>
                {checkedItems.map((item) => (
                  <div key={item._id} className={`${styles.item} ${styles.itemChecked}`}>
                    <button
                      className={styles.checkbox}
                      onClick={() => handleToggle(item._id, false)}
                      aria-label="Uncheck item"
                    >
                      <CheckSquare size={18} />
                    </button>
                    <div className={styles.itemInfo}>
                      <span className={styles.itemAmount}>{item.amount}</span>
                      <span className={styles.itemName}>{item.name}</span>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(item._id)}
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
