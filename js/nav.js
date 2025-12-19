customElements.define('nav-bar', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="nav-zone">
            </nav>
        `;
    }
});



