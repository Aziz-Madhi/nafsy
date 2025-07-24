{
"designSystem": {
"name": "Wellness App Design System",
"version": "1.0.0",
"theme": "dark",
"description": "Design system for wellness/meditation mobile applications with dark theme and calming aesthetics"
},

"colorPalette": {
"primary": {
"background": "#1a1f1a",
"surface": "#2a2f2a",
"card": "#252a25",
"accent": "#4a9b8e"
},
"secondary": {
"teal": "#6bb6ae",
"lightTeal": "#8cc5be",
"orange": "#ff6b47",
"yellow": "#ffd93d"
},
"neutral": {
"white": "#ffffff",
"lightGray": "#a0a5a0",
"mediumGray": "#6a706a",
"darkGray": "#3a3f3a",
"black": "#000000"
},
"status": {
"active": "#6bb6ae",
"inactive": "#4a4f4a",
"completed": "#6bb6ae",
"current": "#ffffff"
}
},

"typography": {
"fontFamily": {
"primary": "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
"secondary": "SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif"
},
"weights": {
"light": 300,
"regular": 400,
"medium": 500,
"semibold": 600,
"bold": 700
},
"sizes": {
"heading1": {
"fontSize": "28px",
"lineHeight": "34px",
"fontWeight": 600,
"letterSpacing": "-0.5px"
},
"heading2": {
"fontSize": "22px",
"lineHeight": "28px",
"fontWeight": 600,
"letterSpacing": "-0.3px"
},
"heading3": {
"fontSize": "18px",
"lineHeight": "24px",
"fontWeight": 600,
"letterSpacing": "-0.2px"
},
"body": {
"fontSize": "16px",
"lineHeight": "22px",
"fontWeight": 400,
"letterSpacing": "0px"
},
"caption": {
"fontSize": "14px",
"lineHeight": "18px",
"fontWeight": 400,
"letterSpacing": "0.1px"
},
"small": {
"fontSize": "12px",
"lineHeight": "16px",
"fontWeight": 400,
"letterSpacing": "0.2px"
}
}
},

"spacing": {
"unit": 4,
"scale": {
"xs": "4px",
"sm": "8px",
"md": "16px",
"lg": "24px",
"xl": "32px",
"xxl": "48px",
"xxxl": "64px"
},
"layout": {
"screenPadding": "24px",
"cardPadding": "20px",
"sectionGap": "32px",
"componentGap": "16px"
}
},

"borderRadius": {
"small": "8px",
"medium": "12px",
"large": "20px",
"xlarge": "24px",
"circle": "50%"
},

"shadows": {
"card": {
"boxShadow": "0 4px 20px rgba(0, 0, 0, 0.3)",
"elevation": "medium"
},
"button": {
"boxShadow": "0 2px 10px rgba(0, 0, 0, 0.2)",
"elevation": "low"
}
},

"components": {
"header": {
"structure": "greeting + stats",
"greeting": {
"typography": "heading1",
"color": "neutral.white",
"marginBottom": "lg"
},
"stats": {
"layout": "horizontal",
"gap": "md",
"itemStructure": "icon + number + label"
}
},

    "statCard": {
      "backgroundColor": "primary.card",
      "borderRadius": "large",
      "padding": "lg",
      "layout": "horizontal",
      "alignItems": "center",
      "gap": "sm",
      "icon": {
        "size": "24px",
        "colors": ["secondary.yellow", "secondary.orange"]
      },
      "number": {
        "typography": "heading3",
        "color": "neutral.white"
      },
      "label": {
        "typography": "body",
        "color": "neutral.lightGray"
      }
    },

    "progressIndicator": {
      "layout": "horizontal",
      "gap": "sm",
      "justifyContent": "space-between",
      "marginTop": "lg",
      "marginBottom": "xl",
      "dot": {
        "size": "40px",
        "borderRadius": "circle",
        "states": {
          "completed": "status.completed",
          "inactive": "status.inactive",
          "current": "status.current"
        }
      },
      "label": {
        "typography": "small",
        "color": "neutral.lightGray",
        "textAlign": "center",
        "marginTop": "xs"
      }
    },

    "mainCard": {
      "backgroundColor": "primary.card",
      "borderRadius": "xlarge",
      "padding": "xl",
      "textAlign": "center",
      "marginBottom": "lg",
      "illustration": {
        "maxWidth": "200px",
        "marginBottom": "lg",
        "style": "flat illustration with soft colors"
      },
      "dayCounter": {
        "typography": "heading1",
        "color": "neutral.white",
        "marginBottom": "xs"
      },
      "subtitle": {
        "typography": "body",
        "color": "neutral.lightGray"
      }
    },

    "primaryButton": {
      "backgroundColor": "neutral.white",
      "color": "primary.background",
      "borderRadius": "large",
      "padding": "md xl",
      "typography": "body",
      "fontWeight": "medium",
      "textAlign": "center",
      "minHeight": "56px",
      "shadow": "button",
      "states": {
        "hover": {
          "backgroundColor": "neutral.lightGray"
        },
        "pressed": {
          "backgroundColor": "neutral.mediumGray"
        }
      }
    },

    "sectionHeader": {
      "typography": "heading3",
      "color": "neutral.white",
      "marginBottom": "md"
    },

    "bottomNavigation": {
      "backgroundColor": "primary.background",
      "borderTop": "1px solid",
      "borderColor": "primary.surface",
      "padding": "sm lg",
      "layout": "horizontal",
      "justifyContent": "space-around",
      "icon": {
        "size": "24px",
        "color": "neutral.mediumGray",
        "activeColor": "primary.accent"
      }
    }

},

"layoutPatterns": {
"mobileScreen": {
"maxWidth": "430px",
"padding": "screenPadding",
"backgroundColor": "primary.background",
"minHeight": "100vh"
},

    "cardGrid": {
      "display": "grid",
      "gap": "md",
      "gridTemplateColumns": "repeat(auto-fit, minmax(150px, 1fr))"
    },

    "stackLayout": {
      "display": "flex",
      "flexDirection": "column",
      "gap": "sectionGap"
    }

},

"animations": {
"transitions": {
"default": "all 0.2s ease-in-out",
"slow": "all 0.3s ease-in-out",
"bounce": "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)"
},
"hover": {
"scale": "1.02",
"duration": "0.2s"
}
},

"iconography": {
"style": "minimal, rounded",
"weight": "regular",
"sizes": {
"small": "16px",
"medium": "24px",
"large": "32px"
},
"colors": {
"primary": "neutral.white",
"secondary": "neutral.lightGray",
"accent": "primary.accent"
}
},

"illustrations": {
"style": "flat, minimalist",
"colorPalette": ["secondary.teal", "neutral.white", "secondary.yellow"],
"characteristics": [
"Soft, rounded shapes",
"Calming poses and expressions",
"Nature elements (butterflies, etc.)",
"Gradient-free flat colors",
"Simple geometric forms"
]
},

"designPrinciples": {
"hierarchy": "Clear visual hierarchy with typography and spacing",
"contrast": "High contrast text on dark backgrounds for accessibility",
"consistency": "Consistent spacing, border radius, and color usage",
"simplicity": "Minimal UI with focus on core actions",
"wellness": "Calming colors and imagery to promote relaxation"
}
}
