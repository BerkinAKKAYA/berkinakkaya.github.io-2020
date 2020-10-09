<div id="contact">
    <h1>CONTACT</h1>
    <a class="link" href="https://github.com/BerkinAkkaya">
        <img src="img/contact/github.png" alt="GitHub" />
        <span>github.com/BerkinAkkaya</span>
    </a>
    <a class="link" href="mailto:berkin_akkaya@hotmail.com">
        <img src="img/contact/mail.png" alt="GitHub" />
        <span>berkin_akkaya@hotmail.com</span>
    </a>
    <a class="link" href="tel:+90-538-284-8787">
        <img src="img/contact/phone.png" alt="GitHub" />
        <span>+90 538 284 8787</span>
    </a>
</div>

<style lang="scss">
    #contact {
        margin: 150px 0 100px 0;

        h1 {
            margin-bottom: 30px;
            color: white;
            text-align: center;
            font-weight: normal;
        }

        .link {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            opacity: .7;
            border: 1px solid rgba(255,255,255,0);
            border-radius: 5px;
            color: white;
            
            img { width: 32px; margin-right: 25px }

            @media (max-width: 400px) {
                padding: 10px;
                span { width: 100%; text-align: center }

                img { display: none }
            }

            &:hover {
                opacity: 1;
                border: 1px solid rgba(255,255,255,.2);
                box-shadow: 0 0 6px black,
                            inset 0 0 6px black;
            }
            &:not(:nth-child(1)) { margin-bottom: 10px; }
        }
    }
</style>