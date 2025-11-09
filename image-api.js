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
  }

  // Lit reactive properties
  static get properties() {
    return {
      ...super.properties,
      cards: { type: Array },
      loadedCount: { type: Number },
    };
  }

  // Lit scoped styles
  static get styles() {
    return [super.styles,
    css`
      :host {
        display: block;
        padding: 1rem;
        background-color: var(--bg-color);
        font-family: var(--ddd-font-secondary);
      }

      /* Light Theme */
      :host {
        --bg-color: var(--ddd-theme-default-shrineTan);
        --text-color: var(--ddd-theme-default-landgrantBrown);
        --card-bg: var(--ddd-theme-default-alertImmediate);
      }

      /* Dark Theme */
      @media(prefers-color-scheme: dark) {
        :host {
          --bg-color: var(--ddd-theme-default-wonderPurple);
          --text-color: var(--ddd-theme-default-potential70);
          --card-bg: var(--ddd-theme-default-athertonViolet);
        }
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
        width: 100%;
      }

      .card {
        border: 2px solid var(--text-color);
        background-color: var(--card-bg);
        border-radius: 12px;
        padding: 0.75rem;
        color: var(--text-color);
        text-align: center;
      }

      .author-info {
        margin-bottom: 0.5rem;
      }

      .author-info img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
      }

      .card > img {
        width: 100%;
        height: 300px;
        object-fit: cover;
        border-radius: 8px;
        margin: 0.5rem 0;
      }

      button {
        margin: 0.5rem;
        padding: 0.5rem 1rem;
        background-color: var(--text-color);
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
        background-color: var(--bg-color);
      }

      .actions {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin: 1rem 0;
      }

      .sentinel {
        height: 1px;
        visibility: hidden;
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
              <button @click="${() => this.toggleLike(card.id, true)}" ?active="${card.isLiked}">🩷 Like</button>
              <button @click="${() => this.toggleLike(card.id, false)}" ?active="${card.isDisliked}">👎 Dislike</button>
            </div>

            <div class="share">
              <button @click="${() => this.copyShareLink(card.id)}">
                ${card.copied ? 'Copied!' : 'Copy Share Link'}
              </button>
            </div>

          </div>
        `)}
      </div>
      <div class="sentinel"></div>
    `;
  }

   // Lifecycle - first updated
  firstUpdated() {
    this.loadData();
  }

   // Fetch data from API
  async loadData() {
    try {
      const response = await fetch('/api/getData.js');
      const data = await response.json();

      const saved = JSON.parse(localStorage.getItem('likes') || '{}');
      
      this.cards = data.map(item => ({
        ...item,
        isLiked: saved[item.id]?.isLiked || false,
        isDisliked: saved[item.id]?.isDisliked || false,
        copied: false,
      }));

      await this.updateComplete;
      this.setupIntersectionObserver();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Set up intersection observer
  setupIntersectionObserver() {
    const sentinelElement = this.shadowRoot.querySelector('.sentinel');
    console.log('Sentinel element found?', sentinelElement);
    console.log('Total cards:', this.cards.length);
    console.log('Currently showing:', this.loadedCount);

    if (!sentinelElement) {
      console.error('Sentinel not found!');
      return;
    }

    new IntersectionObserver(([entry]) => {
      console.log('Observer triggered! isIntersecting:', entry.isIntersecting);
      if (entry.isIntersecting && this.loadedCount < this.cards.length) {
        console.log('Loading more! Old count:', this.loadedCount);
        this.loadedCount = Math.min(this.loadedCount + 10, this.cards.length);
        console.log('New count:', this.loadedCount);
      }
    }, { rootMargin: '200px' }).observe(sentinelElement);
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
      this.cards = this.cards.map(c =>
        c.id === id ? { ...c, copied: true } : c
      );
      
      setTimeout(() => {
        this.cards = this.cards.map(c =>
          c.id === id ? { ...c, copied: false } : c
        );
      }, 1500);
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