customElements.define('nav-bar', class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="nav-zone">
                <div class="logo img-container">
                    <a href="#home" target="_self" class="link-to-home">
                    <img src="" alt="" class="logo-img">
                    </a>
                </div>
                <ul class="menu-zone">
                    <li class="pointer menu-container">
                        <div class="about">
                            <div class="title-box">
                                <a href="#about">
                                    <span class="title-3xs w4">關於我</span>
                                </a>
                            </div>
                        </div>
                    </li>
                    <li class="pointer menu-container">
                        <div class="project">
                            <div class="title-box">
                                <a href="#project" target="_self">
                                    <span class="title-3xs w4">作品集</span>
                                </a>
                            </div>
                        </div>
                    </li>
                    <li class="pointer menu-container">
                        <div class="contact">
                            <div class="title-box">
                                <a href="#contact" target="_self">
                                    <span class="title-3xs w4">聯繫我</span>
                                </a>
                            </div>
                        </div>
                    </li>
                </ul>
                <div class="icons-container">
                    <div class="menu-btn pointer">
                        <div class="close svg-container">
                            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.573303 0.499704C1.02073 0.054511 1.74435 0.0563246 2.18954 0.503755L8.16797 6.51222L14.1464 0.503755C14.5916 0.0563246 15.3152 0.054511 15.7626 0.499704C16.2101 0.944898 16.2119 1.66851 15.7667 2.11594L9.78018 8.13253L15.8353 14.218C16.2804 14.6655 16.2786 15.3891 15.8312 15.8343C15.3838 16.2795 14.6602 16.2777 14.215 15.8302L8.16797 9.75284L2.12097 15.8302C1.67578 16.2777 0.952162 16.2795 0.504732 15.8343C0.0573011 15.3891 0.0554876 14.6655 0.500681 14.218L6.55576 8.13253L0.569252 2.11594C0.124059 1.66851 0.125872 0.944898 0.573303 0.499704Z" fill="w"/>
                            </svg>
                        </div>
                        <i class="fa-solid fa-bars icon-control"></i>
                    </div>
                </div>
                    
            </nav>
        `;
    }
});



