<script>
  import { onDestroy, createEventDispatcher, onMount, tick } from "svelte";
  import InputField from "$lib/components/reusable/InputField.svelte";
  import DropDown from "$lib/components/reusable/DropDown.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";

  export let questionData = {
    question: "",
    images: [],
    errorMsg: null,
    successMsg: null,
  };
  export let resetForm = false;
  export let mode;
  export let questionId; // required for edit mode

  export let options = [...Array(4).fill(null)].map((_, index) => ({
    id: uuid(),
    text: "",
    files: [],
    previews: [],
    isCorrect: false,
    error: "",
    apiMessage: null,
    apiError: null,
  }));

  export let correctAnswer = "";
  export let validationErrors = {};

  const dispatch = createEventDispatcher();

  const maxNumberOfQuestionImages = 10;
  const maxNumberOfOptionImages = 3;
  let imageSizeLimit = 2 * 1024 * 1024;
  const optionLabels = ["A", "B", "C", "D"];

  let isProcessing = false;

  // Drag & reorder states
  let isDragging = false;
  let dragSource = null; // { type: 'qn' | 'option', optIndex?: number, index: number }
  let backupQuestionImages = null;
  let backupOptions = null;

  $: questionNotification = resolveNotification({
    error: questionData.errorMsg,
    success: questionData.successMsg,
  });

  $: optionNotifications = options.map((o) =>
    resolveNotification({
      error: o.apiError,
      secondaryError: o.error,
      success: o.apiMessage,
    })
  );

  // Generate available options for correct answer dropdown (only if text or image is present)
  $: availableCorrectAnswers = options
    .map((opt, index) => ({
      id: opt.id,
      name: `${optionLabels[index]}: ${opt.text || "(Image option)"}`,
      hasContent:
        opt.text.trim() !== "" || (opt.previews && opt.previews.length > 0),
    }))
    .filter((opt) => opt.hasContent);

  // ------------------------- Add Question Files -------------------------------------

  async function uploadQuestionImage(file, position) {
    if (!questionId) {
      questionData = {
        ...questionData,
        errorMsg: "Question ID not provided",
        successMsg: null,
      };
      return;
    }

    isProcessing = true;
    questionData = { ...questionData, successMsg: null, errorMsg: null };

    try {
      const form = new FormData();
      form.append("position", Number(position)); // 1-based position
      form.append("file", file);

      const res = await fetch(
        `/apis/questions/${questionId}/images/questions`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res?.json().catch(() => ({}));

      if (!res.ok) {
        questionData = {
          ...questionData,
          errorMsg:
            data.error || data.message || "Failed to upload question image.",
          successMsg: null,
        };
      } else {
        // Append locally so UI reflects the newly uploaded image immediately
        const added = { id: uuid(), file: null, preview: data.s3_url };
        questionData = {
          ...questionData,
          images: [...questionData.images, added],
        };

        questionData = {
          ...questionData,
          successMsg: "Successfully uploaded question image.",
          errorMsg: null,
        };
        dispatch("change", { questionData, options, correctAnswer });
      }
    } catch (e) {
      questionData = {
        ...questionData,
        errorMsg: "Failed to upload question image.",
        successMsg: null,
      };
    } finally {
      isProcessing = false;
    }
  }

  function addQuestionFiles(files) {
    // clear previous question-level notifications
    questionData = { ...questionData, errorMsg: null, successMsg: null };

    const remainingSlots =
      maxNumberOfQuestionImages - questionData?.images?.length;

    if (remainingSlots <= 0) {
      return;
    }

    const validFiles = [];
    for (const f of files) {
      if (!/^image\//.test(f.type)) {
        questionData = {
          ...questionData,
          errorMsg: "Only image files are allowed",
          successMsg: null,
        };
        continue;
      }
      if (f.size > imageSizeLimit) {
        questionData = {
          ...questionData,
          errorMsg: "Image size should be less than 2MB",
          successMsg: null,
        };
        continue;
      }
      validFiles.push(f);
    }

    if (mode === "edit") {
      // Only upload one image at a time in edit mode
      if (validFiles.length === 0) return;
      const fileToUpload = validFiles[0];
      const position = questionData.images.length + 1; 
      uploadQuestionImage(fileToUpload, position);
      return;
    }

    // add mode: allow multiple local previews
    const next = [];
    for (const f of validFiles) {
      if (next.length >= remainingSlots) break;
      next.push({ id: uuid(), file: f, preview: makePreview(f) });
    }

    if (next.length) {
      questionData = {
        ...questionData,
        images: [...questionData.images, ...next],
      };
      dispatch("change", { questionData, options, correctAnswer });
    }
  }

  function onQuestionPickerChange(e) {
    questionData = { ...questionData, errorMsg: null, successMsg: null };
    const files = Array.from(e.target.files || []);
    addQuestionFiles(files);
    e.target.value = ""; // allow re-picking same files
  }

  // ---------------------------- Remove Question Image ----------------------------------
  async function removeQuestionImage(id) {
    const index = questionData?.images?.findIndex((x) => x.id === id);
    if (index === -1) return;

    // If edit mode, call server API with positions payload
    if (mode === "edit") {
      // Prevent removing the last image if there's no question text
      const isLastImage = (questionData?.images || []).length === 1;
      const hasText = !!(
        questionData?.question && questionData.question.trim() !== ""
      );
      if (isLastImage && !hasText) {
        questionData = {
          ...questionData,
          errorMsg:
            "Question requires text or at least one image. Add text before removing the last image.",
          successMsg: null,
        };
        return;
      }

      if (!questionId) {
        questionData = {
          ...questionData,
          errorMsg: "Question ID not provided",
          successMsg: null,
        };
        return;
      }

      isProcessing = true;
      questionData = { ...questionData, successMsg: null, errorMsg: null };

      try {
        const res = await fetch(
          `/apis/questions/${questionId}/images/questions`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            // position is 1 based
            body: JSON.stringify({ positions: [index + 1] }),
          }
        );

        const data = await res?.json().catch(() => ({}));

        if (!res.ok) {
          questionData = {
            ...questionData,
            errorMsg:
              data.error || data.message || "Failed to delete question image.",
          };
        } else {
          // Remove locally after successful server deletion
          const img = questionData.images[index];
          if (img?.preview) revoke(img.preview);
          questionData = {
            ...questionData,
            images: questionData.images.filter((x) => x.id !== id),
          };

          questionData = {
            ...questionData,
            successMsg: data.message || "Successfully deleted question image.",
            errorMsg: null,
          };
          dispatch("change", { questionData, options, correctAnswer });
        }
      } catch (e) {
        questionData = {
          ...questionData,
          errorMsg: "Failed to delete question image.",
          successMsg: null,
        };
      } finally {
        isProcessing = false;
      }

      return;
    }

    // add mode: remove locally
    const img = questionData.images.find((x) => x.id === id);
    if (img?.preview) revoke(img.preview);
    questionData = {
      ...questionData,
      images: questionData.images.filter((x) => x.id !== id),
    };
    dispatch("change", { questionData, options, correctAnswer });
  }

  // ----------------------- Add/Remove Option Image --------------------------------

  async function clearOptionImage(id, index) {
    const optIndex = options.findIndex((o) => o.id === id);
    if (optIndex === -1) return;

    const opt = options[optIndex];

    options = options.map((o) =>
      o.id === id ? { ...o, apiMessage: null, apiError: null } : o
    );

    // Edit mode
    if (mode === "edit") {
      const isLastOptionImage = (opt?.previews || []).length === 1;
      const hasOptionText = !!(opt?.text && opt.text.trim() !== "");
      if (isLastOptionImage && !hasOptionText) {
        options = options.map((o) =>
          o.id === id
            ? {
                ...o,
                apiError:
                  "Option requires text or at least one image. Add text before removing the last image.",
                apiMessage: null,
              }
            : o
        );
        return;
      }

      if (!questionId) {
        options = options.map((o) =>
          o.id === id
            ? { ...o, apiError: "Question ID not provided", apiMessage: null }
            : o
        );
        return;
      }

      isProcessing = true;

      try {
        options = options.map((o) => ({
          ...o,
          apiError: null,
          apiMessage: null,
        }));
        // Build positions payload (1-based positions)
        let positions = [index + 1];

        const res = await fetch(
          `/apis/questions/${questionId}/images/options?option=${optIndex + 1}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ positions }),
          }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg =
            data.error || data.message || "Failed to delete option image.";
          options = options.map((o) =>
            o.id === id ? { ...o, apiError: msg, apiMessage: null } : o
          );
        } else {
          // Remove locally after successful server deletion
          const newFiles = [...opt.files];
          const newPreviews = [...opt.previews];

          if (typeof index === "number") {
            revoke(newPreviews[index]);
            newFiles.splice(index, 1);
            newPreviews.splice(index, 1);
          }

          options = options.map((o, idx) =>
            idx === optIndex
              ? {
                  ...o,
                  files: newFiles,
                  previews: newPreviews,
                  apiMessage:
                    data.message || "Successfully deleted option image.",
                  apiError: null,
                }
              : o
          );

          // clear the file input value for this option
          const el = document.getElementById(`opt-file-${id}`);
          if (el) el.value = "";

          dispatch("change", { questionData, options, correctAnswer });
        }
      } catch (e) {
        options = options.map((o) =>
          o.id === id
            ? {
                ...o,
                apiError: "Failed to delete option image.",
                apiMessage: null,
              }
            : o
        );
      } finally {
        isProcessing = false;
      }

      return;
    }

    // Add mode: remove locally (existing behavior)
    options = options.map((o) => {
      if (o.id !== id) return o;

      const newFiles = [...o.files];
      const newPreviews = [...o.previews];

      if (typeof index === "number") {
        revoke(newPreviews[index]);
        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);
      }

      return { ...o, files: newFiles, previews: newPreviews };
    });

    const el = document.getElementById(`opt-file-${id}`);
    if (el) el.value = "";
    dispatch("change", { questionData, options, correctAnswer });
  }

  function onOptionFileChange(e, opt) {
    const files = Array.from(e.target.files || []);
    const maxImages = 3;
    let optError = "";

    // Validate files and set first error if any
    const validFiles = files.filter((f) => {
      if (!/^image\//.test(f.type)) {
        optError = "Only image files are allowed";
        return false;
      }
      if (f.size > imageSizeLimit) {
        optError = "Image size should be less than 2MB";
        return false;
      }
      return true;
    });

    // Persist validation error immediately so UI shows it
    options = options.map((o) =>
      o.id === opt.id ? { ...o, error: optError } : o
    );

    // EDIT mode: upload single file to server and append returned preview
    if (mode === "edit") {
      if (validFiles.length === 0) return;
      uploadOptionImage(validFiles[0], opt);
      return;
    }

    // ADD mode: local previews
    const remainingSlots = maxImages - opt.previews.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);
    const newPreviews = filesToAdd.map((f) => makePreview(f));

    const updatedOpt = {
      ...opt,
      error: optError || opt.error,
      files: [...opt.files, ...filesToAdd],
      previews: [...opt.previews, ...newPreviews],
    };

    options = options.map((o) => (o.id === opt.id ? updatedOpt : o));
    dispatch("change", { questionData, options, correctAnswer });
  }

  // new: upload single option image in edit mode and append returned URL to previews
  async function uploadOptionImage(file, opt) {
    const optIndex = options.findIndex((o) => o.id === opt.id);
    if (optIndex === -1) return;

    if (!questionId) {
      options = options.map((o) =>
        o.id === opt.id
          ? {
              ...o,
              apiError: "Question ID not provided",
              apiMessage: null,
              error: null,
            }
          : o
      );
      return;
    }

    isProcessing = true;

    try {
      options = options.map((o) => ({
        ...o,
        apiError: null,
        apiMessage: null,
        error: null,
      }));

      const form = new FormData();
      form.append("position", Number(options[optIndex].previews.length + 1)); // 1-based pos
      form.append("file", file);

      const res = await fetch(
        `/apis/questions/${questionId}/images/options?option=${optIndex + 1}`,
        {
          method: "POST",
          body: form,
        }
      );

      const data = await res?.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          data.error || data.message || "Failed to upload option image.";
        options = options.map((o) =>
          o.id === opt.id ? { ...o, apiError: msg, apiMessage: null } : o
        );
      } else {
        const addedPreview = data?.s3_url;
        options = options.map((o, idx) =>
          idx === optIndex
            ? {
                ...o,
                files: [...o.files, null],
                previews: [...o.previews, addedPreview],
                apiMessage: "Successfully uploaded option image.",
                apiError: null,
                error: null,
              }
            : o
        );

        // clear the file input value for this option
        const el = document.getElementById(`opt-file-${opt.id}`);
        if (el) el.value = "";

        dispatch("change", { questionData, options, correctAnswer });
      }
    } catch (e) {
      options = options.map((o) =>
        o.id === opt.id
          ? {
              ...o,
              apiError: "Failed to upload option image.",
              apiMessage: null,
            }
          : o
      );
    } finally {
      isProcessing = false;
    }
  }

  // Update text option
  function updateOption(index, newText) {
    options = options.map((o, idx) =>
      idx === index
        ? { ...o, text: typeof newText === "string" ? newText : o.text }
        : o
    );
    dispatch("change", { questionData, options, correctAnswer });
  }

  // ---------------------------------- Drag and Drop -----------------------------------

  function onDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    addQuestionFiles(files);
    isDragging = false;
  }

  // ------------------------ Reorder Functions----------------------------

  function reorderArrayByMoving(arr, from, to) {
    const len = Array.isArray(arr) ? arr.length : 0;
    if (!Number.isInteger(from) || !Number.isInteger(to)) return arr.slice();
    if (from < 0 || from >= len || to < 0 || to >= len) return arr.slice();
    const a = arr.slice();
    const [m] = a.splice(from, 1);
    a.splice(to, 0, m);
    return a;
  }

  async function sendReorderPayload(payload, onSuccess, onFailure) {
    if (!questionId) {
      const error = "Question ID not provided";
      questionData = { ...questionData, errorMsg: error, successMsg: null };
      if (onFailure) onFailure(new Error(error));
      return;
    }

    isProcessing = true;
    try {
      const res = await fetch(`/apis/questions/${questionId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res?.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || data.message || "Failed to reorder images.";
        if (onFailure) onFailure(new Error(msg));
      } else {
        if (onSuccess) onSuccess(data);
      }
    } catch (e) {
      if (onFailure) onFailure(e);
    } finally {
      isProcessing = false;
    }
  }

  function handleDragStart(type, optIndex, index, e) {
    // Only allow dragging in edit mode and when not processing
    if (mode !== "edit" || isProcessing) {
      e.preventDefault();
      return;
    }
    dragSource = { type, optIndex, index };

    // allow dragging image preview ghost
    try {
      e.dataTransfer.setData("text/plain", JSON.stringify(dragSource));
      e.dataTransfer.effectAllowed = "move";
    } catch {}
  }

  function handleDragOver(e) {
    // Only allow drag-over visual feedback in edit mode
    if (mode !== "edit") return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDropOnTarget(type, optIndex, targetIndex, e) {
    // Only allow drops in edit mode and when not processing
    if (mode !== "edit" || isProcessing) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    if (!dragSource) return;

    // Only allow reorders within same container (qn <-> qn, option <-> same option)
    if (dragSource.type !== type) return;
    if (type === "option" && dragSource.optIndex !== optIndex) return;

    const from = dragSource.index;
    const to = targetIndex;
    // validate indices before proceeding
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      dragSource = null;
      return;
    }
    if (from === to) {
      dragSource = null;
      return;
    }

    // Backup state to allow revert
    backupQuestionImages = questionData.images?.slice?.() || null;
    backupOptions = options.map((o) => ({
      files: o.files?.slice?.() || [],
      previews: o.previews?.slice?.() || [],
    }));

    // Optimistically update UI
    if (type === "qn") {
      const oldPositions = questionData.images.map((_, i) => i + 1);
      const newPositions = reorderArrayByMoving(oldPositions, from, to);
      questionData = {
        ...questionData,
        images: reorderArrayByMoving(questionData.images, from, to),
      };

      const payload = {
        qn: newPositions,
        option1: [],
        option2: [],
        option3: [],
        option4: [],
      };

      sendReorderPayload(
        payload,
        () => {
          // success
          questionData = {
            ...questionData,
            errorMsg: null,
            successMsg: "Successfully reordered question images.",
          };
          dispatch("change", { questionData, options, correctAnswer });
          dragSource = null;
        },
        (err) => {
          // failure: revert to backup
          questionData.errorMsg = err.message;
          if (backupQuestionImages) {
            questionData = { ...questionData, images: backupQuestionImages };
            dispatch("change", { questionData, options, correctAnswer });
          }
          dragSource = null;
        }
      );
    } else if (type === "option") {
      const opt = options[optIndex];
      const length = opt.previews.length;
      const oldPositions = Array.from({ length }, (_, i) => i + 1);
      const newPositions = reorderArrayByMoving(oldPositions, from, to);

      // reorder files & previews for the option
      const newFiles = reorderArrayByMoving(opt.files || [], from, to);
      const newPreviews = reorderArrayByMoving(opt.previews || [], from, to);

      // apply optimistic change
      options = options.map((o, idx) =>
        idx === optIndex ? { ...o, files: newFiles, previews: newPreviews } : o
      );

      const payload = {
        qn: [],
        option1: [],
        option2: [],
        option3: [],
        option4: [],
      };
      payload[`option${optIndex + 1}`] = newPositions;

      sendReorderPayload(
        payload,
        (data) => {
          // success
          options = options.map((o) => ({
            ...o,
            apiMessage: null,
            apiError: null,
          }));
          options = options.map((o, idx) =>
            idx === optIndex
              ? {
                  ...o,
                  apiMessage: "Successfully reordered option images.",
                  apiError: null,
                }
              : o
          );
          dispatch("change", { questionData, options, correctAnswer });
          dragSource = null;
        },
        (err) => {
          const msg = err?.message || "Failed to reorder option images.";
          // clear per-option notifications first, then revert and set error on affected option
          options = options.map((o) => ({
            ...o,
            apiMessage: null,
            apiError: null,
          }));
          if (backupOptions) {
            options = options.map((o, idx) => ({
              ...o,
              files: backupOptions[idx].files.slice(),
              previews: backupOptions[idx].previews.slice(),
              apiError: idx === optIndex ? msg : null,
              apiMessage: null,
            }));
            dispatch("change", { questionData, options, correctAnswer });
          }
          dragSource = null;
        }
      );
    }
  }

  // ------------------------- Correct Answer --------------------------------------

  function setCorrectAnswer(id) {
    correctAnswer = id;
    options = options.map((o) => ({ ...o, isCorrect: o.id === id }));
    dispatch("change", { questionData, options, correctAnswer });
  }

  // ----------------------- Life Cycle -----------------------------------------

  onMount(() => {
    // validationErrors={}
  });
  // Cleanup on destroy
  onDestroy(() => {
    questionData.images.forEach((i) => revoke(i.preview));
    options.forEach((o) => o.previews?.forEach((p) => revoke(p)));
  });

  // -----------------------------General Functions ----------------------------------------
  function uuid() {
    return crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  }

  function makePreview(file) {
    if (!file) return null;
    return URL.createObjectURL(file);
  }

  function revoke(url) {
    try {
      url && URL.revokeObjectURL(url);
    } catch {}
  }

  $: handleFormReset(resetForm);
  async function handleFormReset() {
    if (resetForm === false) return;

    // Clear question text and images
    questionData.images.forEach((i) => revoke(i.preview));
    questionData = {
      question: "",
      images: [],
      errorMsg: null,
      successMsg: null,
    };

    // Reset options (include clearing per-option messages)
    options = [...Array(4).fill(null)].map((_, index) => ({
      id: uuid(),
      text: "",
      files: [],
      previews: [],
      isCorrect: false,
      error: "",
      apiMessage: null,
      apiError: null,
    }));

    await tick();

    correctAnswer = "";

    // Clear all file input values
    const qEl = document.getElementById("question-files");
    if (qEl) qEl.value = "";
    options.forEach((opt) => {
      const el = document.getElementById(`opt-file-${opt.id}`);
      if (el) el.value = "";
    });

    // Reset validation errors
    validationErrors = {};
    // Clear question-level errors
    questionData = { ...questionData, errorMsg: null, successMsg: null };

    dispatch("change", { questionData, options, correctAnswer });
    dispatch("resetSuccessful");
  }

  function resolveNotification({ error, secondaryError, success }) {
    if (error) return { type: "error", text: error };
    if (secondaryError) return { type: "error", text: secondaryError };
    if (success) return { type: "success", text: success };
    return null;
  }
</script>

<div class="rounded-xl p-4 space-y-2 border border-gray-100 shadow-sm">
  <h3 class="text-sm sm:text-base font-semibold text-dark-gray">
    Question Content
  </h3>

  <div class="grid gap-3">
    <!-- Question Content -->
    <div class="grid gap-3">
      <InputField
        label="Question Text"
        name="question"
        placeholder="Enter question text (optional if images provided)"
        value={questionData.question}
        validationErrors={validationErrors.question}
        on:handleInputData={({ detail }) => {
          questionData = { ...questionData, question: detail.value };
          dispatch("change", { questionData, options, correctAnswer });
        }}
      />
      <!-- {#if validationErrors.question}
        <div class="text-red-500 text-xs mt-1">{validationErrors.question}</div>
      {/if} -->
    </div>

    <!-- Question Images -->
    <div class="w-full">
      <input
        id="question-files"
        type="file"
        accept="image/*"
        multiple={mode === "add" ? true : false}
        on:change={onQuestionPickerChange}
        style="display: none;"
      />

      <div
        class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center {questionData
          .images.length >= maxNumberOfQuestionImages
          ? 'cursor-not-allowed'
          : 'cursor-pointer'} transition-all min-h-[120px] flex flex-col justify-center items-center hover:border-slate-400 hover:bg-slate-50 {isDragging
          ? 'bg-slate-100 border-slate-500'
          : ''}"
        role="button"
        tabindex="0"
        aria-label="Drop zone for question images"
        on:click={() => {
          if (questionData.images.length >= 10 || isProcessing) {
            return;
          }
          document.getElementById("question-files").click();
        }}
        on:keydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (questionData.images.length >= 10) {
              return;
            }
            document.getElementById("question-files").click();
          }
        }}
        on:dragenter={() => (isDragging = true)}
        on:dragleave={() => (isDragging = false)}
        on:dragover|preventDefault
        on:drop={onDrop}
      >
        <div class="grid grid-cols-4 gap-4 p-2 w-full">
          {#each questionData.images as img, qIndex (img.id)}
            <div
              class="relative group bg-white rounded-lg border border-slate-200 p-2 h-[120px] flex items-center justify-center"
              draggable={mode === "edit"}
              on:dragstart={(e) => mode === "edit" && handleDragStart("qn", null, qIndex, e)}
              on:dragover={handleDragOver}
              on:drop={(e) => mode === "edit" && handleDropOnTarget("qn", null, qIndex, e)}
            >
              <button
                type="button"
                class="w-full h-full"
                on:click|stopPropagation={() =>
                  window.open(
                    img.preview && !String(img.preview).startsWith("blob:")
                      ? img.preview +
                          (img.preview.includes("?") ? "&" : "?") +
                          `cb=${Date.now()}`
                      : img.preview,
                    "_blank"
                  )}
              >
                <img
                  class="w-full h-full max-h-[120px] object-contain"
                  src={
                  img.preview && !String(img.preview).startsWith("blob:")
                    ? img.preview +
                      (img.preview.includes("?") ? "&" : "?") +
                      `cb=${Date.now()}`
                    : img.preview}
                  alt={`Question ${questionData.images.indexOf(img) + 1}`}
                />
              </button>
              <button
                type="button"
                class="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                on:click|stopPropagation={() => {
                  questionData = {
                    ...questionData,
                    errorMsg: null,
                    successMsg: null,
                  };
                  if (!isProcessing) removeQuestionImage(img.id);
                }}
              >
                ×
              </button>
            </div>
          {/each}
          {#if questionData.images.length < maxNumberOfQuestionImages}
            <div
              class="h-[120px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <div class="text-2xl text-slate-400">+</div>
              <div class="text-sm text-slate-500">Add Image</div>
              <div class="text-slate-400 text-xs">
                ({maxNumberOfQuestionImages - questionData.images.length} left)
              </div>
            </div>
          {/if}
        </div>
        {#if questionData.images.length >= maxNumberOfQuestionImages}
          <div class="mt-1 text-blue-500 text-xs text-left pl-2">
            Maximum number of images (10) reached.
          </div>
        {/if}
        {#if questionNotification}
          <div
            class={questionNotification.type === "error"
              ? "mt-2 text-red-500 text-xs text-left pl-2"
              : "mt-2 text-green-500 text-xs text-left pl-2"}
          >
            {questionNotification.text}
          </div>
        {/if}
      </div>
    </div>

    <!-- Options -->

    <div class="rounded-xl p-4 space-y-4 border border-gray-100 shadow-sm">
      <h3 class="text-sm font-medium text-dark-gray">Answer Options</h3>
      <div class="space-y-6">
        {#each options as opt, i (opt.id)}
          <div>
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm"
              >
                {optionLabels[i]}
              </span>
              <div class="flex-1">
                <InputField
                  label=""
                  name={`option${i + 1}`}
                  placeholder="Text (optional if image provided)"
                  value={opt.text}
                  validationErrors={validationErrors[`option${i + 1}`]}
                  on:handleInputData={({ detail }) =>
                    updateOption(i, detail.value)}
                />
                <!-- {#if validationErrors[`option${i + 1}`]}
                  <div class="text-red-500 text-xs mt-1">{validationErrors[`option${i + 1}`]}</div>
                {/if} -->
              </div>
            </div>
            <div class="w-full pl-11 mt-2">
              <input
                id={"opt-file-" + opt.id}
                type="file"
                accept="image/*"
                multiple={mode === "add" ? true : false}
                on:change={(e) => onOptionFileChange(e, opt)}
                style="display: none;"
              />
              <div
                class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center {opt
                  .previews.length >= maxNumberOfOptionImages
                  ? 'cursor-not-allowed'
                  : 'cursor-pointer'} transition-all min-h-[120px] flex flex-col justify-center items-center hover:border-slate-400 hover:bg-slate-50 {isDragging ===
                opt.id
                  ? 'bg-slate-100 border-slate-500'
                  : ''}"
                role="button"
                tabindex="0"
                aria-label={`Drop zone for option ${optionLabels[i]} images`}
                on:click={() => {
                  if (opt.previews.length >= 3) {
                    options = options.map((oo) =>
                      oo.id === opt.id
                        ? {
                            ...oo,
                            error: "Maximum number of images (3) already added",
                          }
                        : oo
                    );
                    return;
                  }
                  document.getElementById("opt-file-" + opt.id).click();
                }}
                on:keydown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (opt.previews.length >= 3) {
                      options = options.map((oo) =>
                        oo.id === opt.id
                          ? {
                              ...oo,
                              error:
                                "Maximum number of images (3) already added",
                            }
                          : oo
                      );
                      return;
                    }
                    document.getElementById("opt-file-" + opt.id).click();
                  }
                }}
                on:dragenter|preventDefault={() => (isDragging = opt.id)}
                on:dragleave|preventDefault={() => (isDragging = null)}
                on:dragover|preventDefault
                on:drop|preventDefault={(e) => {
                  const files = Array.from(e.dataTransfer?.files || []);
                  onOptionFileChange({ target: { files } }, opt);
                  isDragging = null;
                }}
              >
                <div class="grid grid-cols-4 gap-4 p-2 w-full">
                  {#each opt.previews as preview, index (index)}
                    <div
                      class="relative group bg-white rounded-lg border border-slate-200 p-2 h-[120px] flex items-center justify-center"
                      draggable={mode === "edit"}
                      on:dragstart={(e) => mode === "edit" && handleDragStart("option", i, index, e)}
                      on:dragover={handleDragOver}
                      on:drop={(e) => mode === "edit" && handleDropOnTarget("option", i, index, e)}
                    >
                      <button
                        type="button"
                        class="w-full h-full"
                        on:click|stopPropagation={() =>
                          window.open(
                            preview && !String(preview).startsWith("blob:")
                              ? preview +
                                  (preview.includes("?") ? "&" : "?") +
                                  `cb=${Date.now()}`
                              : preview,
                            "_blank"
                          )}
                      >
                        <img
                          class="w-full h-full max-h-[120px] object-contain"
                          src={preview && !String(preview).startsWith("blob:")
                            ? preview +
                              (preview.includes("?") ? "&" : "?") +
                              `cb=${Date.now()}`
                            : preview}
                          alt={`Option ${optionLabels[i]} ${index + 1}`}
                        />
                      </button>
                      <button
                        type="button"
                        class="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                        on:click|stopPropagation={() => {
                          options = options.map((oo) =>
                            oo.id === opt.id ? { ...oo, error: "" } : oo
                          );
                          clearOptionImage(opt.id, index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  {/each}
                  {#if opt.previews.length < maxNumberOfOptionImages}
                    <div
                      class="h-[120px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      <div class="text-2xl text-slate-400">+</div>
                      <div class="text-sm text-slate-500">Add Image</div>
                      <div class="text-slate-400 text-xs">
                        ({maxNumberOfOptionImages - opt.previews.length} left)
                      </div>
                    </div>
                  {/if}
                </div>
                {#if opt.previews.length >= maxNumberOfOptionImages}
                  <div class="mt-1 text-blue-500 text-xs text-left pl-2">
                    Maximum number of images (3) reached.
                  </div>
                {/if}

                {#if optionNotifications[i]}
                  <div
                    class={optionNotifications[i].type === "error"
                      ? "mt-2 text-red-500 text-xs text-left pl-2"
                      : "mt-2 text-green-500 text-xs text-left pl-2"}
                  >
                    {optionNotifications[i].text}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Correct Answer -->
    <div class="grid lg:grid-cols-2 gap-4">
      <DropDown
        title="Correct Answer"
        placeholder="Select correct answer"
        options={availableCorrectAnswers}
        selectedItemUuid={correctAnswer}
        selectedItemName={correctAnswer
          ? availableCorrectAnswers.find((opt) => opt.id == correctAnswer)
              ?.name || ""
          : ""}
        validationErrors={validationErrors.correct_answer}
        required={true}
        on:handleDispatchFilterData={({ detail }) =>
          setCorrectAnswer(detail.selectedOption.id)}
        on:handleCancelSelection={() => setCorrectAnswer("")}
      />
      <!-- {#if validationErrors.correct_answer}
        <div class="text-red-500 text-xs mt-1">{validationErrors.correct_answer}</div>
      {/if} -->
    </div>
  </div>
</div>

{#if isProcessing}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <LoadingSpinner size="medium" />
  </div>
{/if}
