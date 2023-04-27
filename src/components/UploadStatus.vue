<template>
  <div id="box" :class="(failed) ? 'failed' : (uploaded) ? 'success' : ''">
    <div id="outer">
      <div id="inner" v-if="started">
        <p>Uploading {{ file.name }}...</p>
        <b-progress type="is-success" :value="progress_percent" show-value>
          {{ progress_text }}
        </b-progress>
      </div>
      <div id="inner" v-else-if="uploaded">
        <code v-if="show_url" @click="copy_clipboard">{{ url }}</code>
        <p v-else>Copied to clipboard!</p>
      </div>
      <div v-else-if="failed">
        <p>Uploading <code>{{ file.name }}</code> failed! {{ err_message }}</p>
      </div>
      <div id="button-div" v-if="!failed">
        <b-icon icon="trash-can" id="remove-button" v-if="uploaded"></b-icon>
        <div id="expires">
          <p style="font-size: 0.8rem;"><b-icon icon="history" size="is-small"></b-icon>{{ length_text(file.expire_after) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

const units = ["bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

function prettyPrintBytes(value) {
  let index = 0;

  while (value >= 1024 && ++index) {
    value = value / 1024;
  }

  return value.toFixed(2) + " " + units[index];
}

export default {
  props: ['file'],
  data() {
    return {
      started: true,
      uploaded: false,
      failed: false,
      url: '',
      progress_percent: 0,
      progress_text: '',
      show_url: true,
      err_message: ''
    }
  },
  methods: {
    copy_clipboard() {
      this.show_url = false;
      navigator.clipboard.writeText(this.url);

      setTimeout(() => this.show_url = true, 1000);
    },
    length_text(expire_after) {
      switch (expire_after) {
        case "1":
          return "1h";
        case "12":
          return "12h";
        case "24":
          return "1 day";
        case "72":
          return "3 days";
      }
    }
  },
  created() {
    if (this.file.size > Number(process.env.VUE_APP_MAX_FILE_SIZE_MIB) * 1048576) {
      this.started = false;
      this.uploaded = false;
      this.failed = true;

      this.err_message = `Maximum file size exceeded (max ${process.env.VUE_APP_MAX_FILE_SIZE_MIB} MiB, got ${prettyPrintBytes(this.file.size)})`;
    } else {
      const that = this;
      const headers = { "Content-Type": "multipart/form-data" };
      const formData = new FormData();
      formData.append('file', this.file);
  
  
      axios.post('http://localhost:3000/upload', formData, {
        headers,
        onUploadProgress: function (progressEvent) {
          that.progress_percent = (progressEvent.loaded / progressEvent.total) * 100;
          that.progress_text = prettyPrintBytes(progressEvent.loaded);
        },
        timeout: 300000
      })
      .then(() => {
        // TODO: API returns path to the file maybe
        // TODO: before this step, the API saves the file's original name,
        //       short code and expiry_date to redis
        this.url = this.file.name;
        this.started = false;
        this.uploaded = true;
        this.failed = false;
      })
      .catch((err) => {
        this.err_message = err.message;
        this.started = false;
        this.uploaded = false;
        this.failed = true;
      });
    }
  }
}
</script>

<style scoped>
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
