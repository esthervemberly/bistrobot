'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useChatStore } from '@/stores/chatStore';
import { useUIStore } from '@/stores/uiStore';
import { Product } from '@/lib/data/products';
import { BotIcon } from '@/components/icons/Icons';
import ProductDetailModal from '@/components/menu/ProductDetailModal';
import styles from './page.module.css';

export default function ChatHome() {
  const { messages, isTyping, sendMessage } = useChatStore();
  const { toggleSidebar } = useUIStore();
  const [input, setInput] = useState('');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleProductClick = (product: Product) => {
    setDetailProduct(product);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrap}>
      <div className={styles.header}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>☰</button>
        <div>
          <h1 className={styles.title}>BistroBot</h1>
          <p className={styles.subtitle}>AI-Powered Food Assistant</p>
        </div>
        <div className={styles.status}>
          <span className={styles.statusDot}></span>
          Online
        </div>
      </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`${styles.message} ${msg.role === 'user' ? styles.userMsg : styles.assistantMsg}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {msg.role === 'assistant' && (
              <div className={styles.avatar}><BotIcon size={20} /></div>
            )}
            <div className={styles.bubble}>
              <div className={styles.msgContent}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j}>{line || <br />}</p>
                ))}
              </div>

              {/* Product cards from RAG results */}
              {msg.products && msg.products.length > 0 && (
                <div className={styles.productCards}>
                  {msg.products.map(product => (
                    <div key={product.id} className={styles.productCard}>
                      <div className={styles.productImgWrap}>
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={80}
                          height={60}
                          className={styles.productImg}
                        />
                      </div>
                      <div className={styles.productInfo}>
                        <span className={styles.productName}>{product.name}</span>
                        <span className={styles.productPrice}>${product.price.toFixed(2)}</span>
                      </div>
                      <button
                        className={styles.addBtn}
                        onClick={() => handleProductClick(product)}
                        title="Customize & add to cart"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {msg.suggestions.map(s => (
                    <button
                      key={s}
                      className="chip"
                      onClick={() => handleSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className={`${styles.message} ${styles.assistantMsg}`}>
            <div className={styles.avatar}><BotIcon size={20} /></div>
            <div className={styles.bubble}>
              <div className={styles.typing}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Product Detail Modal */}
      {detailProduct && (
        <ProductDetailModal
          product={detailProduct}
          onClose={() => setDetailProduct(null)}
        />
      )}

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.inputInner}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Ask me about our menu, recommendations, or your order..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
            </svg>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
