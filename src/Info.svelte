<script>
    import Typewriter from './Typewriter.svelte';

    let show = false;
    document.addEventListener("scroll", () => { show = true })
</script>

{#if show}
    <Typewriter interval={10}>
    <p id="info">
        I study Information Security in Istanbul.
        I created many web apps & published games
        so far and i am passionate about doing more.
    </p>
    </Typewriter>
{:else}
    <div id="placeholder"></div>
{/if}

<style>
#info {
    width: 600px;
    max-width: calc(100vw - 70px);
    text-align: center;
    font-size: 1.2em;
    opacity: .8;
    line-height: 1.8em;
    margin: 120px 0;
    color: white;
}
#placeholder {
    height: 300px;
}
</style>