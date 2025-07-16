# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nafsy** is a mental health React Native app built with Expo, featuring AI-powered chat, mood tracking, wellness exercises, and multilingual support (English/Arabic). The app uses Clerk for authentication, Convex for real-time backend, and follows iOS design patterns.

You are an expert in TypeScript, React Native, Expo, Nativewind v4, and React Native Reanimated 4 development.

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.
- Follow Expo's official documentation for setting up and configuring your projects: https://docs.expo.dev/

## Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.
- Use strict mode in TypeScript for better type safety.

## Syntax and Formatting

- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.

## Key Principles and Workflow Guidance

- If you are given a task, don't overcomplicate it. Do a simple approach. If it didn't function, go into more advanced solutions cleverly.

(Rest of the existing content remains unchanged)