<script setup>
import { ref } from "vue";

const messages = {
  en: {
    summary: "Remove vr.ko from vendor_boot",
    intro:
      "The file is processed locally in your browser and is never uploaded. The tool removes vr.ko and cleans its modules.* index entries.",
    choose: "Choose vendor_boot.img",
    patch: "Remove vr.ko and download",
    processing: "Processing…",
    idle: "Idle",
    loading: "Loading tool…",
    ready: "Tool ready. Please upload a vendor_boot partition image.",
    selected: "Selected",
    working: "Parsing and repacking the image. Keep this page open…",
    failed: "Patch failed",
    loaded: "Tool loaded",
    started: "Starting processing",
    done: "Processing complete. The patched vendor_boot image download has been requested.",
    logLabel: "Patch log",
    warning:
      "Flashing an incorrect or mismatched image may prevent the device from booting. Back up the original vendor_boot and ensure the image matches the installed firmware.",
    progress: {
      parse_image: "Parsing vendor_boot image",
      find_ramdisk: "Finding the target vendor ramdisk",
      decompress_ramdisk: "Decompressing vendor ramdisk",
      parse_cpio: "Parsing ramdisk",
      remove_module: "Removing vr.ko and cleaning module indexes",
      rebuild_cpio: "Rebuilding ramdisk",
      repack_image: "Repacking vendor_boot image",
      complete: "Patch complete",
    },
    errors: {
      parse_boot_image: "Unable to parse the vendor_boot image",
      missing_ramdisk: "The image has no ramdisk",
      not_vendor_boot_v4:
        "The uploaded image is not a vendor_boot v4 image with a vendor ramdisk table",
      missing_vendor_ramdisk_entry:
        "No patchable vendor ramdisk entry was found",
      decompress_vendor_ramdisk: "Failed to decompress the vendor ramdisk",
      parse_vendor_ramdisk_cpio: "Failed to parse the vendor ramdisk CPIO",
      rebuild_cpio: "Failed to rebuild the CPIO",
      repack_vendor_boot: "Failed to repack vendor_boot",
      invalid_index_file: "Invalid module index file",
    },
    removed: "Removed",
    not_found: "vr.ko not found in",
    cleaned: "Cleaned",
  },
};
const t = messages.en;

const initialized = ref(false);
const loading = ref(false);
const processing = ref(false);
const progress = ref(0);
const logs = ref([]);
const status = ref("");
const selectedFile = ref(null);
let worker;

function initialize(event) {
  if (!event.currentTarget.open || initialized.value || loading.value) return;
  loading.value = true;
  status.value = t.loading;
  try {
    worker = new Worker("/tools/vivo-vr-patcher-worker.js");
    worker.onmessage = handleWorkerMessage;
    worker.onerror = ({ message }) => handleError(message);
  } catch (error) {
    handleError(error instanceof Error ? error.message : String(error));
  }
}

function addLog(message) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${message}`);
}

function handleError(message) {
  processing.value = false;
  loading.value = false;
  status.value = `${t.failed}: ${localizeError(message)}`;
  addLog(status.value);
}

function localizeError(value) {
  const [code, detail] = value.split(/:(.*)/s);
  const translated = t.errors[code];
  if (!translated) return value;
  return detail ? `${translated}: ${detail}` : translated;
}

function handleWorkerMessage({ data }) {
  if (data.type === "ready") {
    initialized.value = true;
    loading.value = false;
    status.value = t.ready;
    addLog(t.loaded);
  } else if (data.type === "progress") {
    progress.value = data.percent;
    const message = localizeProgress(data.message);
    status.value = message;
    addLog(`${data.percent}% ${message}`);
  } else if (data.type === "done") {
    downloadResult(data.buffer);
  } else if (data.type === "error") {
    handleError(data.message);
  }
}

function localizeProgress(value) {
  if (t.progress[value]) return t.progress[value];
  const [kind, detail] = value.split(/:(.*)/s);
  if (kind === "removed") return `${t.removed} ${detail}`;
  if (kind === "not_found") return `${t.not_found} ${detail}`;
  if (kind === "cleaned") return `${t.cleaned} ${detail}`;
  return value;
}

function chooseFile(event) {
  selectedFile.value = event.target.files?.[0] ?? null;
  if (selectedFile.value)
    status.value = `${t.selected} ${selectedFile.value.name}`;
}

async function patch() {
  if (!worker || !selectedFile.value || processing.value) return;
  processing.value = true;
  progress.value = 0;
  logs.value = [];
  status.value = t.working;
  addLog(
    `${t.started} ${selectedFile.value.name} (${(selectedFile.value.size / 1024 / 1024).toFixed(2)} MiB)`,
  );
  try {
    const buffer = await selectedFile.value.arrayBuffer();
    worker.postMessage({ type: "patch", buffer }, [buffer]);
  } catch (error) {
    handleError(error instanceof Error ? error.message : String(error));
  }
}

function downloadResult(buffer) {
  try {
    const url = URL.createObjectURL(
      new Blob([buffer], { type: "application/octet-stream" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "vendor_boot_no_vr.img";
    link.click();
    URL.revokeObjectURL(url);
    progress.value = 100;
    status.value = t.done;
    addLog(status.value);
  } catch (error) {
    handleError(error instanceof Error ? error.message : String(error));
  } finally {
    processing.value = false;
  }
}
</script>

<template>
  <details class="vivo-vr-tool" @toggle="initialize">
    <summary>{{ t.summary }}</summary>
    <div class="tool-body">
      <p>{{ t.intro }}</p>
      <label class="file-picker">
        <span>{{ t.choose }}</span>
        <input
          type="file"
          accept=".img,application/octet-stream"
          :disabled="!initialized || processing"
          @change="chooseFile"
        />
      </label>
      <button
        type="button"
        :disabled="!initialized || !selectedFile || processing"
        @click="patch"
      >
        {{ processing ? t.processing : t.patch }}
      </button>
      <div
        class="progress-row"
        role="progressbar"
        :aria-valuenow="progress"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="progress-track">
          <div class="progress-value" :style="{ width: `${progress}%` }"></div>
        </div>
        <span>{{ progress }}%</span>
      </div>
      <p class="status" aria-live="polite">{{ status || t.idle }}</p>
      <pre
        v-if="logs.length"
        class="logs"
        :aria-label="t.logLabel"
      ><code>{{ logs.join("\n") }}</code></pre>
      <p class="danger">{{ t.warning }}</p>
    </div>
  </details>
</template>

<style scoped>
.vivo-vr-tool {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.vivo-vr-tool summary {
  padding: 16px 18px;
  cursor: pointer;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.tool-body {
  padding: 0 18px 18px;
}
.file-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
}
.file-picker span,
button {
  display: inline-flex;
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  background: var(--vp-c-brand-3);
  color: white;
  font-weight: 600;
}
.file-picker input {
  max-width: 100%;
}
button {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.status {
  color: var(--vp-c-text-2);
}
.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.progress-track {
  height: 10px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: var(--vp-c-divider);
}
.progress-value {
  height: 100%;
  border-radius: inherit;
  background: var(--accent-gradient);
  transition: width 0.2s ease;
}
.progress-row span {
  min-width: 3em;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.logs {
  max-height: 260px;
  overflow: auto;
  padding: 14px;
  border-radius: 8px;
  background: var(--vp-code-block-bg);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.danger {
  padding: 12px 14px;
  border-left: 4px solid var(--vp-c-danger-1);
  border-radius: 6px;
  background: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-1);
}
</style>
