<template>
  <div id="app">

    <div class="section">
      <p class="title large-title">Litter!!<br/>🌷📦</p>
      <p class="subtitle">Maximum allowed size is {{ max_size_text }}</p>
    </div>

    <b-notification
      type="is-danger"
      has-icon
      role="alert"
      :closable="false"
      v-model="tokenError"
      style="width: 300px; margin: 0 auto; margin-bottom: 48px; text-align: start;">
      Can't get session token, please refresh the page to try again.<br>
      <code>{{ tokenErrorMessage }}</code>
    </b-notification>

    <div v-if="!tokenError">
      <b-field position="is-centered">
          <b-radio-button v-model="expire_after"
              native-value="1"
              type="is-info is-light is-outlined">
              <span>1h</span>
          </b-radio-button>
  
          <b-radio-button v-model="expire_after"
              native-value="12"
              type="is-info is-light is-outlined">
              <span>12h</span>
          </b-radio-button>
  
          <b-radio-button v-model="expire_after"
              native-value="24"
              type="is-info is-light is-outlined">
              <span>1 day</span>
          </b-radio-button>
  
          <b-radio-button v-model="expire_after"
              native-value="72"
              type="is-info is-light is-outlined">
              <span>3 days</span>
          </b-radio-button>
      </b-field>

      <b-field>
        <b-upload v-model="dropped_files" multiple drag-drop type="is-success" @input="handle_files">
          <section class="section" id="upload-field">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large"></b-icon>
              </p>
              <p>Drop your litter here or click to upload</p>
            </div>
          </section>
        </b-upload>
      </b-field>
    </div>

    <div id="upload-field" style="margin-bottom: 48px;">
      <UploadStatus
        v-for="(item, index) in [...file_queue].reverse()"
        :file="item.file"
        :started="item.started"
        :uploaded="item.uploaded"
        :failed="item.failed"
        :removed="item.removed"
        :err_text="item.err_text"
        :err_message="item.err_message"
        :url="item.url"
        :progress_percent="item.progress_percent"
        :progress_text="item.progress_text"
        :expire_after="item.expire_after"
        v-bind:key="index"
        @remove="remove_file(item.index)"
      ></UploadStatus>
    </div>
  </div>
</template>

<script>
import UploadStatus from './components/UploadStatus.vue';
import axios from 'axios';

const units = ["bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

function prettyPrintBytes(value) {
  let index = 0;

  while (value >= 1024 && ++index) {
    value = value / 1024;
  }

  return +parseFloat(value).toFixed(2) + " " + units[index];
}

export default {
  name: 'App',
  components: {
    UploadStatus
  },
  data() {
    return {
      dropped_files: [],
      file_queue: [],
      expire_after: '24',
      max_size: 0,
      max_size_text: '',
      index: 0,
      token: '',
      tokenError: false,
      tokenErrorMessage: ''
    };
  },
  methods: {
    handle_files() {
      this.dropped_files.forEach(file => {
        let queueItem = {
          file: file,
          expire_after: this.expire_after,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          err_text: '',
          err_message: '',
          filename_encoded: '',
          url: '',
          progress_percent: 0,
          index: this.index,
        };

        this.file_queue.push(queueItem);
        this.dropped_files = [];

        this.upload_file(this.index);
        this.index++;
      });
    },
    upload_file(index) {
      let item = this.file_queue[index];
      if (item.file.size > this.max_size) {
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;
        
        item.err_text = 'Cannot upload file';
        item.err_message = `Maximum file size exceeded (max ${prettyPrintBytes(this.max_size)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        const headers = { "Content-Type": "multipart/form-data" };
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('expire_after', item.expire_after);
    
        axios.post(`${process.env.VUE_APP_API_URL}/upload`, formData, {
          headers,
          onUploadProgress: function (progressEvent) {
            item.progress_percent = (progressEvent.loaded / progressEvent.total) * 100;
            item.progress_text = prettyPrintBytes(progressEvent.loaded);
          },
          timeout: 300000,
          params: {
            token: this.token
          }
        })
        .then((res) => {
          item.filename_encoded = res.data.path;
          item.url = `${window.location.origin}${window.location.pathname}${item.filename_encoded}`;
          item.started = false;
          item.uploaded = true;
          item.failed = false;
          item.removed = false;
        })
        .catch((err) => {
          item.err_text = 'Cannot upload file';
          item.err_message = err.response.data;
          item.started = false;
          item.uploaded = false;
          item.failed = true;
          item.removed = false;
        });
      }
    },
    remove_file(index) {
      let item = this.file_queue[index];

      axios.get(`${process.env.VUE_APP_API_URL}/remove/${item.filename_encoded}`,
      {
        params: {
          token: this.token
        }
      })
      .then(() => {
        item.started = false;
        item.uploaded = false;
        item.failed = false;
        item.removed = true;
      })
      .catch((err) => {
        item.err_text = 'Cannot remove file';
        item.err_message = err.response.data;
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;
      });
    }
  },
  mounted() {
    this.max_size = Number(process.env.VUE_APP_MAX_FILE_SIZE || 104857600);
    this.max_size_text = prettyPrintBytes(this.max_size);
    axios.get(`${process.env.VUE_APP_API_URL}/token`)
      .then((res) => {
        this.token = res.data.token;
      })
      .catch((err) => {
        this.tokenErrorMessage = err;
        this.tokenError = true;
      });
  },
  watch: {}
};
</script>

<style>
  #app {
    text-align: center;
    margin: 0 auto;
  }

  .large-title {
    font-size: 60pt;
  }

  #upload-field {
    margin: 0 auto;
  }

  @media screen and (min-width: 480px) {
    #upload-field {
      width: 460px;
    }
  }

  @media screen and (max-width: 480px) {
    #upload-field {
      width: 300px;
    }
  }
</style>
