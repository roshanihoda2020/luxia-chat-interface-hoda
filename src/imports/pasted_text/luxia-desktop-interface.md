Design a premium desktop interface for Luxia, an Enterprise AI platform that enables users to chat with AI over structured business knowledge.

This is not a generic AI chatbot.

Each conversation is connected to a Constellation, which represents a curated knowledge workspace built from enterprise data sources such as PDFs, databases, CSV files, crawlers, and knowledge bases.

The AI response is entirely influenced by the active Constellation.

The goal of this interface is to let users chat with AI while continuously understanding and controlling the knowledge behind the conversation, without leaving the chat.

Design Language

Strictly follow the existing Luxia / Fancy Factory Design System.

Use only:

Official Luxia colors
Nunito typography
Existing button styles
Existing border radius
Existing shadows
Existing spacing scale (8pt)
Existing icon style
Existing component language
Existing interaction philosophy

Do NOT invent a new design language.

Create a new product experience using the existing design system.

The final result should feel like an evolution of Luxia rather than a redesign of the brand.

Platform

Desktop Application

1920px

12-column grid

Enterprise Software

Large workspace

Comfortable spacing

Premium feeling

Overall Layout

Create a three-column layout.

Left Navigation

Reserve space for the existing Luxia navigation.

Do not redesign it.

Only create a placeholder.

Center Workspace

This is the primary workspace.

It contains:

• Conversation Header

• Multiple Chat Tabs

• Chat Timeline

• AI Responses

• Transparency Components

• Suggested Questions

• Prompt Composer

Right Workspace

Persistent Constellation Panel.

This is one of Luxia's unique features.

Unlike most AI products, users should always be able to modify the active Constellation while chatting.

The panel is:

collapsible

expandable

resizable

always accessible

never blocks the conversation

Multi Chat

Support multiple simultaneous conversations.

Do NOT call them Sessions.

Call them:

Chats

Each Chat:

belongs to one Constellation

can be renamed

duplicated

deleted

reordered

searched

pinned

Users should be able to switch between Chats instantly without losing context.

Think similar to browser tabs, but optimized for AI workspaces.

Constellation Awareness

Every Chat clearly displays:

Constellation Name

Constellation Type

Current Knowledge Context

Data Status

Active Sources

Relationship Status

Users should always know which Constellation is answering.

Persistent Constellation Sidebar

Design a professional right sidebar containing collapsible sections such as:

Knowledge Base

PDF Files

CSV Tables

Crawler Sources

Instructions

Relationships

Metrics

Context

Data Sources

Database

Recent Updates

Each section supports:

Expand / Collapse

Search

Quick Edit

Drag & Drop

Add

Remove

Replace

Status Indicators

File Count

Last Updated

Everything should be editable without leaving the chat.

AI Transparency

One of Luxia's core principles is transparency.

The interface should visually explain how the AI is generating its answer.

Include a collapsible transparency area showing information such as:

Current Constellation

Retrieved Sources

Reasoning Progress

Retrieved Documents

Knowledge Relationships

Search Progress

Query Status

Confidence

Data Coverage

Users should always understand where information comes from.

AI Responses

Support multiple response types.

Narrative Answer

Tables

Charts

Business Cards

Metrics

Lists

Documents

Visualizations

Responses should feel modular instead of long text blocks.

Each response card supports:

Copy

Edit

Save

Pin

Export

Send to Dashboard

Share

Bookmark

Open Fullscreen

Collapse

Regenerate

Prompt Composer

Design a rich AI composer.

Include:

Large multiline prompt field

Attachment button

Voice input

Language selector

Response Mode selector

@ Commands

Quick Prompt Suggestions

Constellation indicator

Send button

Character counter

Typing status

Prompt history

@ Commands

Typing @ opens an intelligent command menu.

Examples:

@dashboard

@report

@compare

@translate

@insight

@table

@chart

@summary

@pdf

Commands transform the conversation into specialized workflows.

Suggested Questions

Display contextual quick prompts.

Examples:

Summarize

Compare

Generate Dashboard

Create Insights

Explain

Find Trends

Generate SQL

Translate

Continue

Make them horizontally scrollable chips.

Empty State

When no conversation exists:

Luxia illustration

Welcome message

Recent Chats

Recent Constellations

Suggested Prompts

Quick Start Cards

Recent Workspaces

UX Principles

Conversation must remain the center of attention.

Users should never feel disconnected from the chat.

Changing Constellation settings should never replace the conversation.

The right sidebar should allow continuous editing while the conversation remains visible.

Avoid modal-heavy workflows.

Reduce unnecessary navigation.

Keep interactions fast.

Prioritize visibility over hidden menus.

Visual Style

Minimal

Elegant

Enterprise

Premium

Calm

Bright

Large white surfaces

Soft elevation

Rounded cards

Clear hierarchy

Excellent typography

Generous spacing

Very low visual noise

Inspiration

The quality should feel comparable to:

Notion

Linear

Cursor

Claude

Figma

Arc Browser

while maintaining Luxia's own visual identity and the official Fancy Factory design system.