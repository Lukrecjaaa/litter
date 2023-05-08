<!-- eslint-disable vue/no-deprecated-v-on-native-modifier -->
<template>
  <div id="box" :class="(item.failed) ? 'failed' : (item.uploaded) ? 'success' : ''">
    <div id="outer">
      <div id="inner" v-if="item.started">
        <p>Uploading {{ item.file.name }}...</p>
        <b-progress type="is-success" :value="item.progressPercent" show-value>
          {{ item.progressText }}
        </b-progress>
      </div>

      <div id="inner" v-else-if="item.uploaded">
        <p>{{ item.file.name }}</p>
        <code class="upload-success" v-if="show_url" @click="copyClipboard">{{ item.url }}</code>
        <p style="font-size: large; margin: 3px;" v-else>Copied to clipboard!</p>
      </div>

      <div v-else-if="item.failed">
        <p>{{ item.errText }} <code>{{ item.file.name }}</code>: {{ item.errMessage }}</p>
      </div>

      <div v-else-if="item.removed">
        <p>File <code>{{ item.file.name }}</code> safely removed!</p>
      </div>

      <div id="button-div" v-if="item.started || item.uploaded">
        <b-icon
          icon="trash-can"
          id="remove-button"
          v-if="item.uploaded"
          @click.native="$emit('remove')">
        </b-icon>
        <div id="expires">
          <p style="font-size: 0.8rem;">
            <b-icon icon="history" size="is-small"></b-icon>
            {{ lengthText(item.expireAfter) }}
          </p>
        </div>
        <b-icon v-if="item.burn" icon="fire" size="is-small"></b-icon>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['item'],
  data() {
    return {
      show_url: true,
    };
  },
  methods: {
    /* Copy text to clipboard and show a message for a short while */
    copyClipboard() {
      this.show_url = false;
      navigator.clipboard.writeText(this.item.url);

      setTimeout(() => { this.show_url = true; }, 1500);
    },
    /* Convert hours to a more human-readable format */
    lengthText(expireAfter) {
      switch (expireAfter) {
        case '1':
          return '1h';
        case '12':
          return '12h';
        case '24':
          return '1 day';
        case '72':
          return '3 days';
        default:
          return 'N/A';
      }
    },
  },
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
  width: 85%;
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
