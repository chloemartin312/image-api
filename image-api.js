/**
 * Copyright 2025 chloemartin312
 * @license Apache-2.0, see LICENSE for full text.
 */
import { LitElement, html, css } from "lit";
import { DDDSuper } from "@haxtheweb/d-d-d/d-d-d.js";
import { I18NMixin } from "@haxtheweb/i18n-manager/lib/I18NMixin.js";

/**
 * `image-api`
 * 
 * @demo index.html
 * @element image-api
 */
export class ImageApi extends DDDSuper(I18NMixin(LitElement)) {

  static get tag() {
    return "image-api";
  }

  constructor() {
    super();
    this.cards = [];
    this.currentIndex = 0;
    this.copied = false;
  }

  // Lit reactive properties
  static get properties() {
    return {
      ...super.properties,
      cards: { type: Array },
      currentIndex: { type: Number },
      copied: { type: Boolean },
    };
  }

  // Lit scoped styles
  static get styles() {
    return [super.styles,
    css`
      :host {
        display: flex;
        justify-content: center;
        align-items: center;    
        background-color: var(--ddd-theme-default-shrineTan);
        font-family: var(--ddd-font-secondary);
        box-sizing: border-box;
        padding: 1rem;
      }

      button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        background-color: var(--ddd-theme-default-landgrantBrown);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      img {
        width: 300px;
        height: 400px;
        margin: 0.5rem;
        border-radius: 8px;
      }

      .card {
        width: 350px;
        height: 800px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;   
        border: 4px solid var(--ddd-theme-default-landgrantBrown);
        background-color: #FFC3CC;
        border-radius: 12px;
        padding: 1rem;
        color: var(--ddd-theme-default-landgrantBrown);
      }

      .author-info {
        text-align: center;
      }

      .author-info img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .actions button[active] {
        background-color: var(--ddd-theme-default-landgrantBrown);
        transform: scale(1.1);
      }

      .share {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .navigation {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-bottom: 1rem;
      }
    `];
  }

  // Lit render the HTML
  render() {
    const card = this.cards[this.currentIndex];
    return html`
        <div class="card">
          <div class = "author-info">
            <img src="${card.author.avatar}" alt="${card.author.name}'s avatar" />
            <h3>${card.author.name}</h3>
            <p>${card.author.channel}</p>
            <p>Joined: ${card.author.userSince}</p>
          </div>

          <div class="navigation">
            <button @click="${this.prevCard}" ?disabled="${this.currentIndex === 0}">←</button>
            <button @click="${this.nextCard}" ?disabled="${this.currentIndex === this.cards.length - 1}">→</button>
          </div>

          ${card.photoSrc
            ? html`<img src="${card.photoSrc}" alt="Photo by ${card.author.name}}" />`
            : html`<div class="placeholder">Loading...</div>`}
          
          <p>Date taken: ${card.dateTaken}</p>

          <div class="actions">
            <button @click="${() => this.like(card.id)}" ?active="${card.isLiked}">🩷</button>
            <button @click="${() => this.dislike(card.id)}" ?active="${card.isDisliked}">👎</button>
          </div>

          <div class="share">
            <button @click="${() => this.copyShareLink(card.id)}">Copy Share Link</button>
            ${this.copied ? html`<div class="copied-msg">Link copied!</div>` : ""}
        </div>
        </div>`;
  }

   // Fetch data from API
  async loadData() {
    try {
      const response = await fetch('/api/getData');
      if (!response.ok) throw new Error('Failed to fetch user info');
      const data = await response.json();

      // Initialize cards with like/dislike flags
      this.cards = data.map(item => ({
        ...item,
        isLiked: false,
        isDisliked: false,
      }));

      this.loadLikesFromStorage();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Local storage for like/dislike
  saveLikesToStorage() {
    localStorage.setItem('likes', JSON.stringify(this.cards));
  }

  loadLikesFromStorage() {
    const saved = localStorage.getItem('likes');
    if (saved) {
      const savedData = JSON.parse(saved);
      this.cards = this.cards.map(card => {
        const savedCard = savedData.find(s => s.id === card.id);
        return savedCard ? { ...card, ...savedCard } : card;
      });
    }
  }

  // Like/Dislike logic
  like(id) {
    this.cards = this.cards.map(c =>
      c.id === id ? { ...c, isLiked: !c.isLiked, isDisliked: false } : c
    );
    this.saveLikesToStorage();
  }

  dislike(id) {
    this.cards = this.cards.map(c =>
      c.id === id ? { ...c, isDisliked: !c.isDisliked, isLiked: false } : c
    );
    this.saveLikesToStorage();
  }

  // Share link logic
  async copyShareLink(id) {
    const url = `${window.location.origin}${window.location.pathname}?photo=${id}`;
    try {
      await navigator.clipboard.writeText(url);
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  }

  // Navigation logic 
  nextCard() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
    }
  }

  prevCard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  // Lifecycle - first updated
  firstUpdated() {
    this.loadData();
  }
  
  /**
   * haxProperties integration via file reference
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url)
      .href;
  }
}

globalThis.customElements.define(ImageApi.tag, ImageApi);