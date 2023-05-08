<template>
  <div>
    <b-field position="is-centered">
      <b-radio-button
        v-model="expireAfter"
        native-value="1"
        type="is-info is-light is-outlined"
      >
        <span>1h</span>
      </b-radio-button>

      <b-radio-button
        v-model="expireAfter"
        native-value="12"
        type="is-info is-light is-outlined"
      >
        <span>12h</span>
      </b-radio-button>

      <b-radio-button
        v-model="expireAfter"
        native-value="24"
        type="is-info is-light is-outlined"
      >
        <span>1 day</span>
      </b-radio-button>

      <b-radio-button
        v-model="expireAfter"
        native-value="72"
        type="is-info is-light is-outlined"
      >
        <span>3 days</span>
      </b-radio-button>
    </b-field>

    <b-field>
      <b-upload
        v-model="droppedFiles"
        multiple
        drag-drop
        type="is-success"
        @input="handleFiles"
      >
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

    <div id="upload-field" style="margin-bottom: 48px">
      <UploadStatus
        v-for="(item, index) in [...fileQueue].reverse()"
        :item="item"
        v-bind:key="index"
        @remove="removeFile(item.index)"
      ></UploadStatus>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as openpgp from 'openpgp';
import { prettyPrintBytes } from '../utils';

import UploadStatus from './UploadStatus.vue';

export default {
  components: {
    UploadStatus,
  },
  props: ['token', 'maxSize', 'burnAfterDownload', 'encrypt', 'publicKey'],
  data() {
    return {
      expireAfter: '24',
      droppedFiles: [],
      fileQueue: [],
      index: 0,
    };
  },
  methods: {
    /* Prepare dropped files for upload or encryption */
    handleFiles() {
      this.droppedFiles.forEach((file) => {
        const queueItem = {
          file,
          expireAfter: this.expireAfter,
          started: true,
          uploaded: false,
          failed: false,
          removed: false,
          errText: '',
          errMessage: '',
          filenameEncoded: '',
          url: '',
          progressPercent: 0,
          index: this.index,
          burn: this.burnAfterDownload,
        };

        this.fileQueue.push(queueItem);
        this.droppedFiles = [];

        if (this.encrypt) {
          this.encryptFile(this.index);
        } else {
          this.uploadFile(this.index);
          this.index++;
        }
      });
    },
    /* Upload dropped file or encrypted blob to /upload endpoint of the API */
    uploadFile(index, formDataEnc = null) {
      const item = this.fileQueue[index];

      if (item.file.size > this.maxSize) {
        item.started = false;
        item.uploaded = false;
        item.failed = true;
        item.removed = false;

        item.errText = 'Cannot upload file';
        item.errMessage = `Maximum file size exceeded (max ${prettyPrintBytes(this.maxSize)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        item.started = true;
        item.uploaded = false;
        item.failed = false;
        item.removed = false;

        const headers = { 'Content-Type': 'multipart/form-data' };
        let formData;
        if (this.encrypt) {
          formData = formDataEnc;
        } else {
          formData = new FormData();
          formData.append('file', item.file);
        }

        formData.append('expireAfter', item.expireAfter);
        formData.append('burn', item.burn);

        axios.post(`${process.env.VUE_APP_API_URL}/upload`, formData, {
          headers,
          /* Update progress bar on upload progress event */
          onUploadProgress(progressEvent) {
            item.progressPercent = (progressEvent.loaded / progressEvent.total) * 100;
            item.progress_text = prettyPrintBytes(progressEvent.loaded);
          },
          timeout: 300000,
          params: {
            token: this.token,
          },
        })
          .then((res) => {
            item.filenameEncoded = res.data.path;
            item.url = `${window.location.origin}${window.location.pathname}${item.filenameEncoded}`;
            item.started = false;
            item.uploaded = true;
            item.failed = false;
            item.removed = false;
          })
          .catch((err) => {
            item.errText = 'Cannot upload file';
            item.errMessage = err.response.data;
            item.started = false;
            item.uploaded = false;
            item.failed = true;
            item.removed = false;
          });
      }
    },
    /* Try to remove a file */
    removeFile(index) {
      const item = this.fileQueue[index];

      axios.get(
        `${process.env.VUE_APP_API_URL}/remove/${item.filenameEncoded}`,
        {
          params: {
            token: this.token,
          },
        },
      )
        .then(() => {
          item.started = false;
          item.uploaded = false;
          item.failed = false;
          item.removed = true;
        })
        .catch((err) => {
          item.errText = 'Cannot remove file';
          item.errMessage = err.response.data;
          item.started = false;
          item.uploaded = false;
          item.failed = true;
          item.removed = false;
        });
    },
    /* Encrypt file and prepare it for upload */
    encryptFile(index) {
      const item = this.fileQueue[index];

      if (item.file.size > this.maxSize) {
        item.started = false;
        item.failed = true;

        item.errText = 'Cannot encrypt file';
        item.errMessage = `Maximum file size exceeded (max ${prettyPrintBytes(this.maxSize)}, got ${prettyPrintBytes(item.file.size)})`;
      } else {
        const reader = new FileReader();
        reader.readAsArrayBuffer(item.file);
        reader.onload = async () => {
          const data = reader.result;

          try {
            openpgp.encrypt({
              message: await openpgp.createMessage({ binary: new Uint8Array(data) }),
              encryptionKeys: this.publicKey,
              format: 'binary',
            }).then((encrypted) => {
              item.started = false;
              item.failed = false;

              const blob = new Blob([encrypted], { type: 'application/pgp-encrypted' });
              const formData = new FormData();
              formData.append('file', blob, `${item.file.name}.gpg`);

              this.uploadFile(this.index, formData);

              this.index++;
            });
          } catch (error) {
            item.started = false;
            item.failed = true;
            item.errText = 'Failed to encrypt file';
            item.errMessage = error;
          }
        };
      }
    },
  },
};
</script>

<style>
  #upload-field {
    margin: 0 auto;
  }

  @media screen and (min-width: 480px) {
    #upload-field {
      width: 440px;
    }
  }

  @media screen and (max-width: 480px) {
    #upload-field {
      width: 280px;
    }
  }
</style>
