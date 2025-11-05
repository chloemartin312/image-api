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
    this.loadedCount = 0;
    this.pageSize = 10;
    this.copied = false;
  }

  // Lit reactive properties
  static get properties() {
    return {
      ...super.properties,
      cards: { type: Array },
      loadedCount: { type: Number },
      pageSize: { type: Number },
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
        box-sizing: border-box;
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
        max-width: 100%;
        height: auto;
        margin: 0.5rem 0;
        border-radius: 8px;
        display: block;
      }

      .card {
        display: inline-block;
        width: 100%;
        margin: 0 0 1rem;
        border: 4px solid var(--ddd-theme-default-landgrantBrown);
        background-color: #FFC3CC;
        border-radius: 12px;
        padding: 1rem;
        color: var(--ddd-theme-default-landgrantBrown);
        box-sizing: border-box;
        break-inside: avoid;
        -webkit-column-break-inside: avoid;
        page-break-inside: avoid;
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

      /* masonry grid container */
      .grid {
        column-gap: 1rem;
        column-fill: auto;
      }

      /* responsive column counts */
      @media (min-width: 1200px) {
        .grid { column-count: 4; }
      }
      @media (min-width: 900px) and (max-width: 1199px) {
        .grid { column-count: 3; }
      }
      @media (min-width: 600px) and (max-width: 899px) {
        .grid { column-count: 2; }
      }
      @media (max-width: 599px) {
        .grid { column-count: 1; }
      }
    `];
  }

  // Lit render the HTML
  render() {
    if (!this.cards || this.cards.length === 0) return html`<p>Loading...</p>`;

    const visible = this.cards.slice(0, this.loadedCount || this.pageSize);

    return html`
      <div class="grid">
        ${visible.map(card => html`
          <div class="card">
            <div class="author-info">
              <img src="${card.author?.avatar || ''}" alt="${card.author?.name || 'Author'}'s avatar" />
              <h3>${card.author?.name || card.title || 'Untitled'}</h3>
              ${card.author?.channel ? html`<p>${card.author.channel}</p>` : ''}
            </div>

            ${card.photoSrc
              ? html`<img src="${card.photoSrc}" alt="Photo by ${card.author?.name || 'author'}" />`
              : html`<div class="placeholder">Loading...</div>`}

            <p>Date taken: ${card.dateTaken || 'Unknown'}</p>

            <div class="actions">
              <button @click="${() => this.like(card.id)}" ?active="${card.isLiked}">🩷</button>
              <button @click="${() => this.dislike(card.id)}" ?active="${card.isDisliked}">👎</button>
            </div>

            <div class="share">
              <button @click="${() => this.copyShareLink(card.id)}">Copy Share Link</button>
            </div>
          </div>
        `)}
      </div>

      <div id="sentinel" style="height:1px"></div>
    `;
  }

   // Lifecycle - first updated
  firstUpdated() {
    this.loadData();

    // Set up intersection observer
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadMore();
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.1 });

    const sentinel = this.renderRoot?.querySelector('#sentinel') || this.querySelector('#sentinel');
    if (sentinel) {
      this._observer.observe(sentinel);
    } else {
      // if sentinel isn't yet in DOM, try again after a tick
      requestAnimationFrame(() => {
        const s = this.renderRoot?.querySelector('#sentinel') || this.querySelector('#sentinel');
        if (s) this._observer.observe(s);
      });
    }
  }

   // Fetch data from API
  async loadData() {
    try {
      const response = await fetch('/api/getData.js');
      const data = await response.json();

      // Initialize cards with like/dislike fields
      this.cards = data.map(item => ({
        ...item,
        isLiked: false,
        isDisliked: false,
      }));

      // Set initial rendered count
      this.loadedCount = Math.min(this.cards.length, this.pageSize);

      this.loadLikesFromStorage();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Load more cards into the grid
  loadMore() {
    if (!this.cards || this.loadedCount >= this.cards.length) return;
    this.loadedCount = Math.min(this.loadedCount + this.pageSize, this.cards.length);
    this.requestUpdate();
  }

  disconnectedCallback() {
    if (this._observer) {
      this._observer.disconnect();
    }
    super.disconnectedCallback();
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

  /**
   * haxProperties integration via file reference
   */
  static get haxProperties() {
    return new URL(`./lib/${this.tag}.haxProperties.json`, import.meta.url)
      .href;
  }
}

globalThis.customElements.define(ImageApi.tag, ImageApi);