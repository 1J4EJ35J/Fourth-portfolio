customElements.define('loading-animation', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <div class="loading-animation-zone">
                <div class="loading-animation-container">
                    <div class="svg-box">
                        
                    </div>
                    <div class="ani-el">
                        <div class="star-conteiner">
                            <div class="star star-1"></div>
                            <div class="star star-2"></div>
                            <div class="star star-3"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
});