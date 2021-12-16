<script>
  async function fetchPOST(url, json) {
    let base_url = 'http://localhost:8000';
    let options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    };
    if (json) options.body = JSON.stringify(json);
    let res = await fetch(base_url + url, options);
    return await res.json();
  }

  async function get() {
    loading = true;
    const json = await fetchPOST('/read', { folder: folder });
    current = 0;
    subcurrent = 0;
    data = json.map(el => {
      let object = el.annotation.object;
      if (!Array.isArray(object)) object = [object];
      el.annotation.object = object;
      return el;
    });
    loading = false;
  }
  function next(danger) {
    if (danger != undefined) {
      data[current].annotation.object[subcurrent].danger = { _text: danger };
      fetchPOST('/write', {
        folder: folder,
        image: data[current].jpg,
        sub: subcurrent,
        danger: danger,
      });
    }
    subcurrent++;
    if (subcurrent == data[current].annotation.object.length) {
      subcurrent = 0;
      current++;
    }
    if (current == data.length) {
      current = 0;
    }
  }
  function last() {
    subcurrent--;
    if (subcurrent < 0) {
      subcurrent = 0;
      current--;
    }
    if (current < 0) {
      current = data.length - 1;
    }
  }

  function handleKeydown(e) {
    if (e.key === '0') next(0);
    if (e.key === '1') next(1);
    if (e.key === '2') next(2);
    if (e.key === 'ArrowLeft') last();
    if (e.key === 'ArrowRight') next();
  }

  let loading = false;

  let folder = 'test';
  let data;
  let current = 0;
  let subcurrent = 0;
</script>

<svelte:body on:keydown={handleKeydown} />

<main>
  <div class="folder">
    <label>
      <input type="radio" bind:group={folder} name="folder" value={'test'} />
      test
    </label>
    <label>
      <input type="radio" bind:group={folder} name="folder" value={'train'} />
      train
    </label>
    <label>
      <input
        type="radio"
        bind:group={folder}
        name="folder"
        value={'validation'}
      />
      validation
    </label>
  </div>
  {#if loading}
    <p class="title">Loading...</p>
  {:else}
    <button class="fetch" on:click={get}>fetch</button>
  {/if}
  {#if data && !loading}
    <div class="editor">
      <p class="title"><b>{current}</b> {data[current].jpg}</p>
      <div class="dangers">
        {#each data[current].annotation.object as { danger }, i}
          {#if danger}
            <p>
              {#if subcurrent == i}→{/if} <b>{i}</b>
              {danger._text}
            </p>
          {:else}
            <p>
              {#if subcurrent == i}→{/if} <b>{i}</b> unset
            </p>
          {/if}
        {/each}
      </div>
      <div class="buttons">
        <button on:click={() => next(0)}>0</button>
        <button on:click={() => next(1)}>1</button>
        <button on:click={() => next(2)}>2</button>
      </div>
      <div class="image-wrapper">
        <button on:click={last}>←</button>
        <div class="image">
          <img src="data:image/png;base64, {data[current].image}" alt="b64" />
          {#each data[current].annotation.object as { bndbox }, i}
            <div
              class="bndbox {subcurrent == i ? 'bndbox-current' : ''}"
              style="
              top: {(bndbox.ymin._text /
                data[current].annotation.size.height._text) *
                100}%;
              left: {(bndbox.xmin._text /
                data[current].annotation.size.width._text) *
                100}%;
              height: {((bndbox.ymax._text - bndbox.ymin._text) /
                data[current].annotation.size.height._text) *
                100}%;
              width: {((bndbox.ymax._text - bndbox.ymin._text) /
                data[current].annotation.size.width._text) *
                100}%;"
            />
          {/each}
        </div>
        <button on:click={() => next()}>→</button>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    padding: 1rem;
    font-size: 1.2rem;
    text-align: center;
  }
  .fetch {
    margin-top: 10px;
  }

  .title {
    display: inline-block;
    margin: 30px 0 10px 0;
    padding: 5px 10px;
    background-color: #eee;
  }
  .buttons {
    margin: 10px 0;
  }

  .image-wrapper {
    display: flex;
    justify-content: center;
  }
  .image {
    position: relative;
  }
  .bndbox {
    position: absolute;
    border: solid 1px #ffc6ff;
  }
  .bndbox-current {
    border: solid 3px #ff2fe3;
  }
</style>
