<template>
    <div id="box" :class="(failed) ? 'failed' : ''">
      <div id="outer">
        <div id="inner" v-if="started">
          <p>Encrypting {{ file.name }}...</p>
          <b-progress type="is-success"></b-progress>
        </div>

        <div v-else-if="failed">
          <p>{{ errText }} <code>{{ file.name }}</code>: {{ errMessage }}</p>
        </div>

        <div v-else>
            <p>File {{ file.name }} encrypted successfully</p>
        </div>
      </div>
    </div>
  </template>

<script>
export default {
  props: ['file', 'started', 'failed', 'errText', 'errMessage'],
};
</script>

  <style scoped>
  code {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .upload-success {
    font-size: x-large;
    color: black;
  }

  #box {
    margin: 6px;
    padding: 8px;
    border: 1px #aaa dotted;
    border-radius: 4px;
  }

  #outer {
    max-width: 100%;
    text-align: start;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  #expires {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #inner {
    width: 100%;
    text-align: center;
  }

  #inner > p {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  #inner > * {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  #button-div {
    text-align: center;
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: center;
  }

  #cancel-button, #remove-button {
    cursor: pointer;
  }

  .failed {
    background-color: rgba(255, 56, 96, 0.5);
    color: #fff;
  }

  .success {
    background-color: rgba(72, 199, 116, 0.3);
  }
  </style>
