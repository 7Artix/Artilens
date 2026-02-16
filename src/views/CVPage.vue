<template>
    <DynamicWave/>
    <div class="cv-page">
        <PersonalProfile class="personal-profile"/>
        <main class="cv-content">
            <!-- 直接传入 src，组件内部会自动加载 -->
            <MarkdownRenderer
                src="/api/static/cv/cv.md"
                asset-base="/api/static/cv/"
            />
        </main>
        <PageFooter/>
        <div class="corner-stack"><BackTop/></div>
    </div>
</template>

<script setup>
import BackTop from '../components/BackTop.vue';
import DynamicWave from '../components/DynamicWave.vue';
import PageFooter from '../components/PageFooter.vue';
import PersonalProfile from '../components/PersonalProfile.vue';
import { NAV_HEIGHT } from '../config/constants';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
</script>

<style scoped>
.cv-page { 
    min-height: calc(100vh - v-bind(NAV_HEIGHT));
    display: flex;
    flex-direction: column;
    background: transparent;
    padding-top: 20px;
    box-sizing: border-box;
}

.personal-profile {
    margin: 30px auto 60px auto; 
    z-index: 20;
    position: relative;
}

.cv-content {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
    z-index: 10;

    background-color: #f9f9f9;
    border-radius: 24px;
    box-shadow: 0 0 120px 80px #f9f9f9; 
}

.corner-stack { position: fixed; bottom: 40px; right: 40px; z-index: 1000; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
.corner-stack > * { pointer-events: auto; }
</style>