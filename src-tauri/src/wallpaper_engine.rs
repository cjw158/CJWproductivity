//! Wallpaper Engine Module
//! High-performance native rendering using tiny-skia

use image::GenericImageView;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tiny_skia::{
    Color, FillRule, Paint, PathBuilder, Pixmap, Rect, Transform,
};

/// Card data to render on wallpaper
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperCard {
    pub title: String,
    pub content: String,
    pub card_type: CardType,
    pub is_pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CardType {
    Memo,
    Task,
}

/// Wallpaper render options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderOptions {
    pub cards: Vec<WallpaperCard>,
    pub position: CardPosition,
    pub card_width: u32,
    pub card_opacity: f32,
    pub blur_background: bool,
    pub is_dark_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CardPosition {
    BottomRight,
    BottomLeft,
    TopRight,
    TopLeft,
}

impl Default for RenderOptions {
    fn default() -> Self {
        Self {
            cards: vec![],
            position: CardPosition::BottomRight,
            card_width: 280,
            card_opacity: 0.85,
            blur_background: false,
            is_dark_mode: true,
        }
    }
}

/// Check if a file is a valid image
pub fn is_valid_image(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "bmp" | "gif" | "webp")
    } else {
        false
    }
}

/// Render cards onto background image using tiny-skia
pub fn render_wallpaper(
    background_path: &str,
    options: &RenderOptions,
) -> Result<Vec<u8>, String> {
    // Load background image
    let background = image::open(background_path)
        .map_err(|e| format!("Failed to load background: {}", e))?;
    
    let (width, height) = background.dimensions();
    
    // Create pixmap from background
    let mut pixmap = Pixmap::new(width, height)
        .ok_or("Failed to create pixmap")?;
    
    // Copy background to pixmap
    let bg_rgba = background.to_rgba8();
    for (x, y, pixel) in bg_rgba.enumerate_pixels() {
        pixmap.pixels_mut()[(y * width + x) as usize] = 
            tiny_skia::PremultipliedColorU8::from_rgba(
                pixel[0], pixel[1], pixel[2], pixel[3]
            ).unwrap();
    }
    
    // Apply slight darkening overlay
    let mut overlay_paint = Paint::default();
    overlay_paint.set_color(Color::from_rgba8(0, 0, 0, 50));
    let overlay_rect = Rect::from_xywh(0.0, 0.0, width as f32, height as f32).unwrap();
    pixmap.fill_rect(overlay_rect, &overlay_paint, Transform::identity(), None);
    
    // Render cards
    if !options.cards.is_empty() {
        render_cards(&mut pixmap, options, width, height);
    }
    
    // Encode to PNG
    pixmap.encode_png().map_err(|e| format!("Failed to encode PNG: {}", e))
}

/// Render card widgets on the pixmap
fn render_cards(pixmap: &mut Pixmap, options: &RenderOptions, width: u32, height: u32) {
    let card_width = options.card_width as f32;
    let card_padding = 16.0_f32;
    let card_margin = 12.0_f32;
    let corner_radius = 16.0_f32;
    
    // Calculate starting position based on card position
    let (start_x, start_y) = match options.position {
        CardPosition::BottomRight => (
            width as f32 - card_width - 32.0,
            height as f32 - 32.0,
        ),
        CardPosition::BottomLeft => (32.0, height as f32 - 32.0),
        CardPosition::TopRight => (width as f32 - card_width - 32.0, 32.0),
        CardPosition::TopLeft => (32.0, 32.0),
    };
    
    let mut current_y = start_y;
    
    // Render each card (from bottom to top for bottom positions)
    for card in options.cards.iter().take(4) {
        let card_height = calculate_card_height(card, card_width, card_padding);
        
        // Adjust Y for bottom positions (stack upward)
        let card_y = match options.position {
            CardPosition::BottomRight | CardPosition::BottomLeft => {
                current_y -= card_height + card_margin;
                current_y + card_margin
            }
            _ => {
                let y = current_y;
                current_y += card_height + card_margin;
                y
            }
        };
        
        // Draw card background (frosted glass effect)
        draw_rounded_rect(
            pixmap,
            start_x,
            card_y,
            card_width,
            card_height,
            corner_radius,
            if options.is_dark_mode {
                Color::from_rgba8(255, 255, 255, (options.card_opacity * 40.0) as u8)
            } else {
                Color::from_rgba8(0, 0, 0, (options.card_opacity * 30.0) as u8)
            },
        );
        
        // Draw card border
        draw_rounded_rect_stroke(
            pixmap,
            start_x,
            card_y,
            card_width,
            card_height,
            corner_radius,
            if options.is_dark_mode {
                Color::from_rgba8(255, 255, 255, 50)
            } else {
                Color::from_rgba8(0, 0, 0, 20)
            },
            1.0,
        );
        
        // Draw pin indicator for pinned items
        if card.is_pinned {
            let pin_color = match card.card_type {
                CardType::Memo => Color::from_rgba8(251, 191, 36, 255), // Amber
                CardType::Task => Color::from_rgba8(96, 165, 250, 255), // Blue
            };
            draw_circle(
                pixmap,
                start_x + card_width - 12.0,
                card_y + 12.0,
                6.0,
                pin_color,
            );
        }
    }
}

fn calculate_card_height(card: &WallpaperCard, _width: f32, padding: f32) -> f32 {
    // Estimate height based on content length
    let title_height = if card.title.is_empty() { 0.0 } else { 24.0 };
    let content_lines = (card.content.len() as f32 / 30.0).ceil().max(1.0);
    let content_height = content_lines * 20.0;
    
    title_height + content_height + padding * 2.0
}

fn draw_rounded_rect(
    pixmap: &mut Pixmap,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    radius: f32,
    color: Color,
) {
    let mut pb = PathBuilder::new();
    
    // Top-left corner
    pb.move_to(x + radius, y);
    // Top edge
    pb.line_to(x + width - radius, y);
    // Top-right corner
    pb.quad_to(x + width, y, x + width, y + radius);
    // Right edge
    pb.line_to(x + width, y + height - radius);
    // Bottom-right corner
    pb.quad_to(x + width, y + height, x + width - radius, y + height);
    // Bottom edge
    pb.line_to(x + radius, y + height);
    // Bottom-left corner
    pb.quad_to(x, y + height, x, y + height - radius);
    // Left edge
    pb.line_to(x, y + radius);
    // Top-left corner
    pb.quad_to(x, y, x + radius, y);
    pb.close();
    
    if let Some(path) = pb.finish() {
        let mut paint = Paint::default();
        paint.set_color(color);
        paint.anti_alias = true;
        pixmap.fill_path(&path, &paint, FillRule::Winding, Transform::identity(), None);
    }
}

fn draw_rounded_rect_stroke(
    pixmap: &mut Pixmap,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    radius: f32,
    color: Color,
    stroke_width: f32,
) {
    let mut pb = PathBuilder::new();
    
    pb.move_to(x + radius, y);
    pb.line_to(x + width - radius, y);
    pb.quad_to(x + width, y, x + width, y + radius);
    pb.line_to(x + width, y + height - radius);
    pb.quad_to(x + width, y + height, x + width - radius, y + height);
    pb.line_to(x + radius, y + height);
    pb.quad_to(x, y + height, x, y + height - radius);
    pb.line_to(x, y + radius);
    pb.quad_to(x, y, x + radius, y);
    pb.close();
    
    if let Some(path) = pb.finish() {
        let mut paint = Paint::default();
        paint.set_color(color);
        paint.anti_alias = true;
        
        let stroke = tiny_skia::Stroke {
            width: stroke_width,
            ..Default::default()
        };
        pixmap.stroke_path(&path, &paint, &stroke, Transform::identity(), None);
    }
}

fn draw_circle(pixmap: &mut Pixmap, cx: f32, cy: f32, radius: f32, color: Color) {
    let mut pb = PathBuilder::new();
    pb.push_circle(cx, cy, radius);
    
    if let Some(path) = pb.finish() {
        let mut paint = Paint::default();
        paint.set_color(color);
        paint.anti_alias = true;
        pixmap.fill_path(&path, &paint, FillRule::Winding, Transform::identity(), None);
    }
}

