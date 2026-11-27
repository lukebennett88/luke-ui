import { createFileRoute } from '@tanstack/react-router';
import { App } from '../app.js';

// Every view shares this path: `?pr=<number>` and `?source=local` pick the report to review.
export const Route = createFileRoute('/')({ component: App });
