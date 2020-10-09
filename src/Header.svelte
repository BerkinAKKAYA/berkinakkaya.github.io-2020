<script>
    import Particles from "svelte-particles";
    import Typewriter from "./Typewriter.svelte";
 
    let particlesConfig = {
        "particles": {
            "number": { "value": 10 },
            "color": { "value": "#8EFFFF" },
            "size": { "value": 30, "random": true },
            "line_linked": { "enable": false },
            "shape": { "type": "image", "image": { "src": "img/particle.png" } },
            "move": { "enable": true, "speed": 1.5, "random": true, "out_mode": "bounce" }
        },
        "interactivity": {
            "events": {
                "onhover": { "enable": false },
                "onclick": { "enable": false },
                "resize": true
            }
        },
        "retina_detect": true
    };
</script>

<Particles id="particles" options="{particlesConfig}" />

<header class="header">
    <nav>
        <a href="#about">ABOUT</a>
        <a href="#projects">PROJECTS</a>
        <a href="#contact">CONTACT</a>
    </nav>

    <Typewriter scramble={15} interval={10}>
        <h1>BERKIN AKKAYA</h1>
    </Typewriter>

    <footer>
        <span>background by</span>
        <a href="https://www.freepik.es/fotos-vectores-gratis/fondo">freepik</a>
    </footer>
</header>

<style lang="scss">
    :global(#particles) {
        position: absolute;
        left:0;
        top:0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
    }


    header {
        background-position: center;
        background-size: cover;
        background-image: url("/img/banner.webp");
        overflow: hidden;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        width: 100vw;
        height: 100vh;

        nav {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 1px solid rgba(255,255,255,0.3);
            z-index: 1;

            @media (max-width: 450px) {
                flex-direction: column;
                height: 200px;
                justify-content: space-evenly;

                a { width: 80%; text-align: center }
            }

            a {
                padding: 30px 30px 0 30px;
                margin: 0 5px;
                color: white;
                opacity: 0.8;

                &::after {
                    content: "";
                    display: block;
                    width: 0;
                    height: 2px;
                    margin-top: 30px;

                    position: relative;
                    left: 50%;
                    transform: translateX(-50%) translateY(2px);
                    
                    background-color: white;
                    opacity: 0;
                    transition: all .3s;
                }

                &:hover, &:hover::after { opacity: 1 }
                &:hover::after { width: calc(100% + 30px) }
                
                @media (max-width: 400px) {
                    padding: 8px 0;

                    &::after { display: none }
                }
            }
        }

        :global(h1) {
            color: white;
            font-size: 4em;
            font-weight: normal;
            text-shadow: 0 0 10px black, 0 0 10px black;
            padding: 0 10px;
            text-align: center;

            @media (max-width: 600px) {
                font-size: 10vw;
            }

            &::after {
                content: "";
                width: 0;
                height: 4px;
                display: block;
                background-color: #fff;
                margin-top: 10px;
                transition: all .3s ease;
                left: 50%;
                transform: translateX(-50%);
                position: relative;
                box-shadow: 0 0 5px black;
                border-radius: 100px;
            }
            &:hover::after { width: 100% }
        }

        footer {
            margin-bottom: 40px;
            
            span, a { color: white; opacity: .5 }
            a { text-decoration: underline }
            a:hover { opacity: 1 }
        }
    }
</style>