<script>
    const AllProjects = [
        {
            title: "Pomolog",
            description: "Time Management Tool",
            image: "img/projects/pomolog.png",
            link: "https://pomolog-berkinakkaya.web.app/",
            github: "https://github.com/BerkinAKKAYA/Pomolog"
        },{
            title: "Timeline",
            description: "Most Minimalistic Calendar",
            image: "img/projects/timeline.png",
            link: "http://timeline-berkin.web.app/",
            github: "https://github.com/BerkinAKKAYA/Timeline"
        },{
            title: "Stay in the Shadows",
            description: "Stealth & Action Game",
            image: "img/projects/stay-in-the-shadows.png",
            link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.StayintheShadows",
            github: ""
        },{
            title: "Focused YouTube",
            description: "YouTube with Bookmarks",
            image: "img/projects/focused-yt.png",
            link: "https://focused-yt.web.app/",
            github: "https://github.com/BerkinAKKAYA/Focused-YouTube"
        },{
            title: "Jumpy",
            description: "Hypercasual Game",
            image: "img/projects/jumpy.png",
            link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.Jumpy",
            github: "https://github.com/BerkinAKKAYA/Jumpy"
        },{
            title: "Split",
            description: "Hypercasual Game",
            image: "img/projects/split.png",
            link: "https://play.google.com/store/apps/details?id=com.BerkinAkkaya.Split",
            github: "https://github.com/BerkinAKKAYA/Split"
        },{
            title: "svelte-image-gallery",
            description: "Fluid Image Container for Svelte",
            image: "https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg",
            link: "http://npmjs.com/package/svelte-image-gallery",
            github: "https://github.com/BerkinAKKAYA/svelte-image-gallery"
        },{
            title: "Vueweeter",
            description: "Realtime Social Media App",
            image: "img/projects/vue-logo.png",
            link: "https://berkinakkaya.github.io/vueweeter",
            github: "https://github.com/BerkinAKKAYA/vueweeter"
        },{
            title: "Svelte Chat",
            description: "Chat Application Backed by Firestore",
            image: "img/projects/svelte.png",
            link: "https://svelte-chat-berkinakkaya.web.app",
            github: "https://github.com/BerkinAKKAYA/svelte-chat"
        }
    ];

    let LoadedProjects = [];

    document.onscroll = () => {
        const DOC = document.documentElement;
        const top = DOC.scrollTop;
        const height = DOC.scrollHeight - DOC.clientHeight;
        const percent = top / height;

        if (percent >= 0.7) {
            if (AllProjects.length > 0) {
                LoadedProjects = [...LoadedProjects, AllProjects.pop()];
            } else {
                document.onscroll = null;
            }
        }
    }
</script>

<div id="projects">
    <h1 id="head">PROJECTS</h1>

    {#each LoadedProjects as project}
    <div class="project">
        <a href={project.link}>
            <div style="background-image: url({project.image})" class="image"></div>
        </a>

        <div class="right">
            <div class="info">
                <a href={project.link}>
                    <h2>{project.title}</h2>
                </a>
                <p>{project.description}</p>
            </div>
            <div class="buttons">
                <a href="{project.link}" class="visit">VISIT</a>

                {#if project.github}
                <a href="{project.github}" class="github">GitHub</a>
                {:else}
                <abbr title="Not in GitHub." class="github missing">GitHub</abbr>
                {/if}
            </div>
        </div>
    </div>
    {/each}
</div>

<style lang="scss">
    #head {
        text-align: center;
        color: white;
        font-weight: normal;
    }
    .project {
        display: flex;
        margin-top: 70px;
        padding: 0 20px;
        color: white;
        animation: show 1.5s;

        @media (max-width: 600px) {
            margin-top: 75px;
            flex-direction: column;
            align-items: center;
        }

        .image {
            width: 128px;
            height: 128px;
            max-width: 80vw;
            background-position: center;
            background-size: contain;
            background-repeat: no-repeat;
            border-radius: 25px;
        }
        .right {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            margin-left: 50px;

            @media (max-width: 600px) {
                margin: 0;
                align-items: center;
                text-align: center;
                min-height: 130px;
                margin-top: 20px;

                .info p { margin-top: 8px }
            }
            @media (max-width: 320px) {
                min-height: 180px;
            }

            .info a { color: white }
            .info h2 { font-weight: normal }
            .info p { font-size: 1.1em; opacity: .5; margin-top: 10px; }

            .buttons .github { opacity: .6; color: white; }
            .buttons .github:not(.missing):hover { opacity: 1 }
            .buttons .github.missing {
                cursor: help;
                text-decoration: line-through;
                opacity: .2
            }

            .buttons .visit {
                padding: 6px 14px;
                background-color: #fff;
                border-radius: 6px;
                color: black;
                font-size: 1.1em;

                &:hover { border-radius: 15px }
            }
            .buttons .github { margin-left: 15px }
        }
    }

    @keyframes show {
        from { opacity: 0.5; transform: rotateX(90deg) scale(0.5) }
        to   { opacity: 1; transform: rotateX(0deg) scale(1) }
    }
</style>
