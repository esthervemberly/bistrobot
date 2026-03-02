'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/lib/data/products';
import { useCartStore } from '@/stores/cartStore';
import styles from './ProductDetailModal.module.css';

interface Props {
    product: Product;
    onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: Props) {
    const addItem = useCartStore(s => s.addItem);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const defaults: Record<string, string> = {};
        product.options.forEach(opt => {
            const def = opt.choices.find(c => c.is_default);
            if (def) defaults[opt.group_name] = def.option_name;
        });
        return defaults;
    });
    const [notes, setNotes] = useState('');
    const [added, setAdded] = useState(false);

    const calculateTotal = () => {
        let total = product.price;
        product.options.forEach(opt => {
            const selected = selectedOptions[opt.group_name];
            if (selected) {
                const choice = opt.choices.find(c => c.option_name === selected);
                if (choice) total += choice.price_modifier;
            }
        });
        return total * quantity;
    };

    const handleAdd = () => {
        addItem(product, quantity, selectedOptions, notes.trim());
        setAdded(true);
        setTimeout(() => onClose(), 800);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <div className={styles.imageWrapper}>
                    <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        sizes="500px"
                        style={{ objectFit: 'cover' }}
                    />
                </div>

                <div className={styles.content}>
                    <div className={styles.tags}>
                        {product.tags.map(t => (
                            <span key={t} className="badge badge-accent">{t}</span>
                        ))}
                        {product.dietary.map(d => (
                            <span key={d} className="badge badge-success">{d}</span>
                        ))}
                    </div>

                    <h2 className={styles.name}>{product.name}</h2>
                    <p className={styles.desc}>{product.description}</p>

                    <div className={styles.meta}>
                        <span>🔥 {product.calories} cal</span>
                        <span>⏱️ {product.prep_time_min} min</span>
                        {product.allergens.length > 0 && (
                            <span>⚠️ {product.allergens.join(', ')}</span>
                        )}
                    </div>

                    {/* Options */}
                    {product.options.map(opt => (
                        <div key={opt.group_name} className={styles.optionGroup}>
                            <h4 className={styles.optionLabel}>{opt.group_name}</h4>
                            <div className={styles.optionChoices}>
                                {opt.choices.map((choice, idx) => (
                                    <button
                                        key={`${opt.group_name}-${choice.option_name}-${idx}`}
                                        className={`${styles.optionBtn} ${selectedOptions[opt.group_name] === choice.option_name ? styles.selected : ''}`}
                                        onClick={() => setSelectedOptions({ ...selectedOptions, [opt.group_name]: choice.option_name })}
                                    >
                                        <span>{choice.option_name}</span>
                                        {choice.price_modifier > 0 && (
                                            <span className={styles.modifier}>+${choice.price_modifier.toFixed(2)}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Special Instructions */}
                    <div className={styles.notesGroup}>
                        <h4 className={styles.optionLabel}>Special Instructions</h4>
                        <textarea
                            className={styles.notesInput}
                            placeholder="E.g. No onions, extra sauce, allergies..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            maxLength={200}
                            rows={2}
                        />
                    </div>

                    {/* Quantity & Add */}
                    <div className={styles.footer}>
                        <div className={styles.quantity}>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            >−</button>
                            <span className={styles.qtyValue}>{quantity}</span>
                            <button
                                className={styles.qtyBtn}
                                onClick={() => setQuantity(quantity + 1)}
                            >+</button>
                        </div>
                        <button
                            className={`btn btn-primary btn-lg ${added ? styles.addedBtn : ''}`}
                            onClick={handleAdd}
                            style={{ flex: 1 }}
                        >
                            {added ? '✓ Added to Cart' : `Add to Cart — $${calculateTotal().toFixed(2)}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
