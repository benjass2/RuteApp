<script setup lang="ts">
import '@fontsource-variable/inter'
import Dashboard from '@/app/planificacion-rutas/presentation/views/Dashboard.vue'
</script>
<template>
  <Dashboard />
</template>

<style>
:root {
    font-family: 'Inter Variable', 'Segoe UI', system-ui, sans-serif;
    color: #18342c;
    background: #e1e1e1;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    min-width: 320px;
}

button, input, select {
    font: inherit;
}

a {
    color: inherit;
}

:focus-visible {
    outline: 3px solid #07553e;
    outline-offset: 4px;
}

h1, h2, p {
    margin-top: 0;
}

.eyebrow {
    font-size: .66rem;
    font-weight: 700;
    letter-spacing: .16em;
    color: #5c756a;
}

.muted {
    color: #40584f;
    font-size: .88rem;
    line-height: 1.7;
}
.p-button:disabled {
    opacity: 1;
    background: #e7ece9;
    border-color: #8d9e95;
    color: #4d6057;
    cursor: not-allowed;
}

.p-button:focus-visible {
    box-shadow: 0 0 0 2px #fff;
}

</style>
