<template>
  <div id="app">

    <div class="section">
      <p class="title large-title">Litter!!<br/>🌷📦</p>
      <p class="subtitle">Maximum allowed size is {{ max_size }} MiB</p>
    </div>

    <div>
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
        <b-upload v-model="dropped_files" multiple drag-drop type="is-success" @input="temp">
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
        v-for="(file, index) in file_queue"
        :file="file"
        v-bind:key="index"
      ></UploadStatus>
    </div>
  </div>
</template>

<script>
import UploadStatus from './components/UploadStatus.vue';

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
      max_size: 0
    };
  },
  methods: {
    temp() {
      this.dropped_files.forEach(file => {
        file.expire_after = this.expire_after;
        this.file_queue.push(file);
        this.dropped_files = [];
      });
    }
  },
  mounted() {
    this.max_size = Number(process.env.VUE_APP_MAX_FILE_SIZE_MIB);
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
