<template>
    <DynamicWave/>
    <div class="me-page">
        <PersonalProfile class="personal-profile"/>
        <PageFooter/>
    </div>
</template>

<script setup>
import DynamicWave from '../components/DynamicWave.vue';
import PageFooter from '../components/PageFooter.vue';
import PersonalProfile from '../components/PersonalProfile.vue';
import { NAV_HEIGHT } from '../config/constants';

</script>

<style scoped>
.me-page { 
    min-height: calc(100vh - v-bind(NAV_HEIGHT));
    display: flex;
    flex-direction: column;
    background: #f9f9f9;
    padding-top: 20px;
    box-sizing: border-box;
}
.personal-profile {
    margin: 10vh auto auto;
    z-index: 1000;
    position: relative;
}

</style>