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
    this.loadedCount = 10;
    this.copied = false;
  }

  // Lit reactive properties
  static get properties() {
    return {
      ...super.properties,
      cards: { type: Array },
      loadedCount: { type: Number },
      copied: { type: Boolean },
    };
  }

  // Lit scoped styles
  static get styles() {
    return [super.styles,
    css`
      :host {
        display: block;
        padding: 1rem;
        background-color: var(--ddd-theme-default-shrineTan);
        font-family: var(--ddd-font-secondary);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        width: 100%;
      }

      .card {
        border: 4px solid var(--ddd-theme-default-landgrantBrown);
        background-color: #FFC3CC;
        border-radius: 12px;
        padding: 1rem;
        color: var(--ddd-theme-default-landgrantBrown);
      }

      .author-info {
        text-align: center;
        margin-bottom: 1rem;
      }

      .author-info img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
      }

      .card > img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 0.5rem 0;
      }

      button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: var(--ddd-theme-default-landgrantBrown);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }

      button:hover {
        opacity: 0.7;
      }

      button[active] {
        transform: scale(1.1);
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
      }

      .share {
        text-align: center;
      }
    `];
  }

  // Lit render the HTML
  render() {
    if (!this.cards || this.cards.length === 0) return html`<p>Loading...</p>`;

    return html`
      
      <div class="grid">
        ${this.cards.slice(0, this.loadedCount).map(card => html`
          <div class="card">

            <div class="author-info">
              <img src="${card.author?.avatar || ''}" alt="${card.author?.name || 'Author'}">
              <h3>${card.author?.name || card.title || 'Untitled'}</h3>
              ${card.author?.channel ? html`<p>${card.author.channel}</p>` : ''}
            </div>

            ${card.photoSrc ? html`<img src="${card.photoSrc}" alt="Photo">` : ''}
            
            <p>Date taken: ${card.dateTaken || 'Unknown'}</p>

            <div class="actions">
              <button @click="${() => this.toggleLike(card.id, true)}" ?active="${card.isLiked}">🩷</button>
              <button @click="${() => this.toggleLike(card.id, false)}" ?active="${card.isDisliked}">👎</button>
            </div>

            <div class="share">
              <button @click="${() => this.copyShareLink(card.id)}">
                ${this.copied ? 'Copied!' : 'Copy Share Link'}
              </button>
            </div>

          </div>
        `)}
      </div>
      <div id="sentinel"></div>
    `;
  }

   // Lifecycle - first updated
  firstUpdated() {
    this.loadData();

    // Infinite scroll observer
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && this.loadedCount < this.cards.length) {
        this.loadedCount = Math.min(this.loadedCount + 10, this.cards.length);
      }
    }, { rootMargin: '200px' }).observe(this.shadowRoot.querySelector('#sentinel'));
  }

   // Fetch data from API
  async loadData() {
    try {
      // Get data
      const response = await fetch('/api/getData.js');
      const data = await response.json();

      // Load saved likes
      const saved = JSON.parse(localStorage.getItem('likes') || '{}');
      
      // Initialize cards with like/dislike fields
      this.cards = data.map(item => ({
        ...item,
        isLiked: saved[item.id]?.isLiked || false,
        isDisliked: saved[item.id]?.isDisliked || false,
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Like/dislike logic
  toggleLike(id, isLike) {
    this.cards = this.cards.map(c =>
      c.id === id 
        ? { ...c, isLiked: isLike ? !c.isLiked : false, isDisliked: isLike ? false : !c.isDisliked }
        : c
    );
    
    // Save only the like states, not entire cards
    const likes = Object.fromEntries(
      this.cards.filter(c => c.isLiked || c.isDisliked)
        .map(c => [c.id, { isLiked: c.isLiked, isDisliked: c.isDisliked }])
    );
    localStorage.setItem('likes', JSON.stringify(likes));
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

  /**
   * haxProperties integration via file reference
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url)
      .href;
  }
}

globalThis.customElements.define(ImageApi.tag, ImageApi);