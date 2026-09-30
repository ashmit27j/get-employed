/* @ds-bundle: {"format":4,"namespace":"GetEmployedDesignSystem_26a74c","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"CTABanner","sourcePath":"components/cards/CTABanner.jsx"},{"name":"Card","sourcePath":"components/cards/Card.jsx"},{"name":"PricingCard","sourcePath":"components/cards/PricingCard.jsx"},{"name":"TestimonialCard","sourcePath":"components/cards/TestimonialCard.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"Footer","sourcePath":"components/navigation/Footer.jsx"},{"name":"PillTabs","sourcePath":"components/navigation/PillTabs.jsx"},{"name":"TopNav","sourcePath":"components/navigation/TopNav.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/Wordmark.jsx"},{"name":"LOGO_MARK","sourcePath":"components/navigation/logoMark.js"},{"name":"ChangelogRow","sourcePath":"components/status/ChangelogRow.jsx"},{"name":"StatusBadge","sourcePath":"components/status/StatusBadge.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"bbc9b8e68e89","components/cards/CTABanner.jsx":"a4e58b731104","components/cards/Card.jsx":"966f8b188d11","components/cards/PricingCard.jsx":"87bb04d39395","components/cards/TestimonialCard.jsx":"8a09f5a0cb19","components/forms/TextInput.jsx":"f1d7e9b74b7c","components/navigation/Footer.jsx":"0daaa532d577","components/navigation/PillTabs.jsx":"209299243893","components/navigation/TopNav.jsx":"8a9e42260cca","components/navigation/Wordmark.jsx":"193ce3e3c938","components/navigation/logoMark.js":"ef814c63b679","components/status/ChangelogRow.jsx":"412ac34057bd","components/status/StatusBadge.jsx":"ca12b9fbee51","ui_kits/website/Changelog.jsx":"5f7237cd1fe6","ui_kits/website/Figures.jsx":"ce906a7be87f","ui_kits/website/Home.jsx":"266ff1245a13","ui_kits/website/HomeSections.jsx":"d8e8d2ad156f","ui_kits/website/Pricing.jsx":"a0c333d554b5","ui_kits/website/ProductMock.jsx":"8c6118046af2","ui_kits/website/Shared.jsx":"36cf3e21cdcc","ui_kits/website/SignUp.jsx":"3abcb72cd572"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.GetEmployedDesignSystem_26a74c = window.GetEmployedDesignSystem_26a74c || {});

const __ds_scope = {};

const __ds_mark_src = (() => { try { const s = document.currentScript || [...document.scripts].reverse().find(x => x.src && x.src.includes("_ds_bundle.js")); return new URL("../../assets/ge-mark.png", s.src).href; } catch (e) { return "assets/ge-mark.png"; } })();

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-text)",
  fontSize: "var(--type-button-size)",
  lineHeight: "var(--type-button-lh)",
  fontWeight: 500,
  letterSpacing: 0,
  padding: "8px 14px",
  borderRadius: "var(--rounded-md)",
  border: "1px solid transparent",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
  transition: "background var(--duration-fast) var(--ease-standard), box-shadow var(--duration-base) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
  outline: "none",
  minHeight: 36,
  boxSizing: "border-box"
};
const variants = {
  primary: {
    rest: {
      background: "var(--color-primary)",
      color: "var(--color-on-primary)",
      boxShadow: "var(--glow-cta)"
    },
    hover: {
      background: "var(--color-primary-hover)",
      boxShadow: "var(--glow-cta-hover)"
    },
    press: {
      background: "var(--color-primary-pressed)",
      boxShadow: "none"
    }
  },
  secondary: {
    rest: {
      background: "var(--color-surface-1)",
      color: "var(--color-ink)",
      borderColor: "var(--color-hairline)"
    },
    hover: {
      background: "var(--color-surface-2)",
      borderColor: "var(--color-hairline-strong)"
    },
    press: {
      background: "var(--color-surface-3)"
    }
  },
  tertiary: {
    rest: {
      background: "var(--color-canvas)",
      color: "var(--color-ink)"
    },
    hover: {
      background: "var(--color-surface-1)"
    },
    press: {
      background: "var(--color-surface-2)"
    }
  },
  inverse: {
    rest: {
      background: "var(--color-inverse-canvas)",
      color: "var(--color-inverse-ink)"
    },
    hover: {
      background: "var(--color-inverse-surface-1)"
    },
    press: {
      background: "var(--color-inverse-surface-2)"
    }
  }
};
function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  href,
  children,
  style,
  onClick,
  type = "button",
  ...rest
}) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  const [f, setF] = React.useState(false);
  const v = variants[variant] || variants.primary;
  let s = {
    ...base,
    ...v.rest
  };
  if (size === "lg") s = {
    ...s,
    padding: "12px 20px",
    fontSize: 15,
    minHeight: 44
  };
  if (size === "sm") s = {
    ...s,
    padding: "6px 10px",
    fontSize: 13,
    minHeight: 28
  };
  if (fullWidth) s.width = "100%";
  if (disabled) s = {
    ...s,
    background: "var(--color-surface-1)",
    color: "var(--color-ink-tertiary)",
    borderColor: "var(--color-hairline)",
    boxShadow: "none",
    cursor: "not-allowed"
  };else {
    if (h) s = {
      ...s,
      ...v.hover
    };
    if (p) s = {
      ...s,
      ...v.press
    };
  }
  if (f && !disabled) s.boxShadow = (s.boxShadow && s.boxShadow !== "none" ? s.boxShadow + "," : "") + "var(--focus-ring-shadow)";
  const Tag = href ? "a" : "button";
  return /*#__PURE__*/React.createElement(Tag, _extends({
    href: href,
    type: href ? undefined : type,
    disabled: href ? undefined : disabled,
    "aria-disabled": disabled || undefined,
    onClick: disabled ? undefined : onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => {
      setH(false);
      setP(false);
    },
    onMouseDown: () => setP(true),
    onMouseUp: () => setP(false),
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      ...s,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/cards/CTABanner.jsx
try { (() => {
function CTABanner({
  title,
  body,
  primaryLabel = "Get started",
  secondaryLabel,
  onPrimary,
  onSecondary,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      boxShadow: "var(--edge-highlight)",
      borderRadius: "var(--rounded-lg)",
      padding: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 32,
      flexWrap: "wrap",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-headline-size)",
      fontWeight: 600,
      lineHeight: "var(--type-headline-lh)",
      letterSpacing: "var(--type-headline-ls)",
      color: "var(--color-ink)",
      textWrap: "pretty"
    }
  }, title), body && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--type-body-size)",
      color: "var(--color-ink-subtle)"
    }
  }, body)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, secondaryLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    onClick: onSecondary
  }, secondaryLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: onPrimary
  }, primaryLabel)));
}
Object.assign(__ds_scope, { CTABanner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/CTABanner.jsx", error: String((e && e.message) || e) }); }

// components/cards/Card.jsx
try { (() => {
const V = {
  feature: {
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--rounded-lg)",
    padding: 24
  },
  pricing: {
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--rounded-lg)",
    padding: 24
  },
  "pricing-featured": {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-hairline-strong)",
    borderRadius: "var(--rounded-lg)",
    padding: 24
  },
  screenshot: {
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--rounded-xl)",
    padding: 24
  },
  testimonial: {
    background: "var(--color-surface-1)",
    border: "1px solid var(--color-hairline)",
    borderRadius: "var(--rounded-lg)",
    padding: 32,
    fontSize: "var(--type-body-lg-size)",
    lineHeight: "var(--type-body-lg-lh)",
    letterSpacing: "var(--type-body-lg-ls)"
  },
  logo: {
    background: "var(--color-canvas)",
    borderRadius: "var(--rounded-xs)",
    padding: 16,
    color: "var(--color-ink-subtle)",
    fontSize: "var(--type-caption-size)"
  }
};
function Card({
  variant = "feature",
  interactive = false,
  eyebrow,
  title,
  children,
  style,
  onClick
}) {
  const [h, setH] = React.useState(false);
  let s = {
    boxSizing: "border-box",
    color: "var(--color-ink)",
    fontSize: "var(--type-body-size)",
    lineHeight: "var(--type-body-lh)",
    boxShadow: variant === "logo" ? "none" : "var(--edge-highlight)",
    transition: "background var(--duration-base) var(--ease-standard), border-color var(--duration-base) var(--ease-standard)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    ...(V[variant] || V.feature)
  };
  if (interactive && h) s = {
    ...s,
    background: "var(--color-surface-2)",
    borderColor: "var(--color-hairline-strong)",
    cursor: "pointer"
  };
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      ...s,
      ...style
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--type-eyebrow-size)",
      fontWeight: 500,
      letterSpacing: "var(--type-eyebrow-ls)",
      lineHeight: "var(--type-eyebrow-lh)",
      color: "var(--color-ink-subtle)",
      textTransform: "uppercase"
    }
  }, eyebrow), title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-card-title-size)",
      fontWeight: 500,
      lineHeight: "var(--type-card-title-lh)",
      letterSpacing: "var(--type-card-title-ls)",
      color: "var(--color-ink)"
    }
  }, title), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Card.jsx", error: String((e && e.message) || e) }); }

// components/cards/PricingCard.jsx
try { (() => {
function PricingCard({
  tier,
  price,
  period = "/mo",
  description,
  features = [],
  cta = "Get started",
  featured = false,
  onSelect
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    variant: featured ? "pricing-featured" : "pricing",
    style: {
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--type-headline-size)",
      fontWeight: 600,
      lineHeight: "var(--type-headline-lh)",
      letterSpacing: "var(--type-headline-ls)"
    }
  }, tier), description && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--type-body-sm-size)",
      color: "var(--color-ink-subtle)"
    }
  }, description)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      fontWeight: 600,
      letterSpacing: -1
    }
  }, price), period && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-body-sm-size)",
      color: "var(--color-ink-subtle)"
    }
  }, period)), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: featured ? "primary" : "secondary",
    fullWidth: true,
    onClick: onSelect
  }, cta), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontSize: "var(--type-body-sm-size)",
      color: "var(--color-ink-muted)"
    }
  }, features.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      flex: "none",
      marginTop: 7,
      width: 6,
      height: 6,
      borderRadius: "var(--rounded-full)",
      background: featured ? "var(--color-primary)" : "var(--color-ink-tertiary)"
    }
  }), f))));
}
Object.assign(__ds_scope, { PricingCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PricingCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/TestimonialCard.jsx
try { (() => {
function TestimonialCard({
  quote,
  name,
  role,
  avatar
}) {
  const initials = (name || "").split(" ").map(w => w[0]).join("").slice(0, 2);
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    variant: "testimonial",
    style: {
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--color-ink)",
      textWrap: "pretty"
    }
  }, quote), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginTop: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "var(--rounded-full)",
      background: "var(--color-surface-3)",
      border: "1px solid var(--color-hairline)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 500,
      color: "var(--color-ink-muted)"
    }
  }, avatar ? /*#__PURE__*/React.createElement("img", {
    src: avatar,
    alt: "",
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      fontSize: "var(--type-body-sm-size)",
      lineHeight: 1.35
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink)",
      fontWeight: 500
    }
  }, name), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-subtle)"
    }
  }, role))));
}
Object.assign(__ds_scope, { TestimonialCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/TestimonialCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function TextInput({
  label,
  hint,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = "text",
  disabled = false,
  iconLeft,
  style,
  inputStyle,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  const [h, setH] = React.useState(false);
  const id = React.useId();
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: id,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontFamily: "var(--font-text)",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-body-sm-size)",
      fontWeight: 500,
      color: "var(--color-ink-subtle)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--color-surface-1)",
      border: "1px solid " + (f || h ? "var(--color-hairline-strong)" : "var(--color-hairline)"),
      borderRadius: "var(--rounded-md)",
      padding: "8px 12px",
      minHeight: 38,
      boxSizing: "border-box",
      boxShadow: f ? "var(--focus-ring-shadow)" : "none",
      opacity: disabled ? 0.5 : 1,
      transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)"
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      color: "var(--color-ink-subtle)"
    }
  }, iconLeft), /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: type,
    placeholder: placeholder,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--color-ink)",
      fontFamily: "inherit",
      fontSize: "var(--type-body-size)",
      lineHeight: 1.3,
      letterSpacing: "var(--type-body-ls)",
      padding: 0,
      ...inputStyle
    }
  }, rest))), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-caption-size)",
      color: "var(--color-ink-subtle)"
    }
  }, hint));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PillTabs.jsx
try { (() => {
function PillTabs({
  options = [],
  value,
  defaultValue,
  onChange,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue ?? (options[0] && (options[0].value ?? options[0])));
  const cur = value ?? inner;
  const [hov, setHov] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      display: "inline-flex",
      gap: 4,
      padding: 4,
      background: "var(--color-canvas)",
      border: "1px solid var(--color-hairline)",
      borderRadius: "var(--rounded-pill)",
      ...style
    }
  }, options.map((o, i) => {
    const val = o.value ?? o;
    const label = o.label ?? o;
    const sel = val === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      role: "tab",
      "aria-selected": sel,
      onClick: () => {
        setInner(val);
        onChange && onChange(val);
      },
      onMouseEnter: () => setHov(i),
      onMouseLeave: () => setHov(null),
      style: {
        fontFamily: "var(--font-text)",
        fontSize: "var(--type-body-sm-size)",
        fontWeight: 500,
        lineHeight: 1.2,
        padding: "6px 14px",
        minHeight: 30,
        borderRadius: "var(--rounded-pill)",
        border: "none",
        cursor: "pointer",
        background: sel ? "var(--color-surface-2)" : "transparent",
        color: sel || hov === i ? "var(--color-ink)" : "var(--color-ink-subtle)",
        boxShadow: sel ? "var(--glow-active)" : "none",
        transition: "all var(--duration-base) var(--ease-standard)"
      }
    }, label);
  }));
}
Object.assign(__ds_scope, { PillTabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PillTabs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Wordmark.jsx
try { (() => {
function Wordmark({
  size = 18,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.4,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: size,
      letterSpacing: -size * 0.03,
      color: "var(--color-ink)",
      lineHeight: 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: __ds_mark_src,
    alt: "",
    width: Math.round(size * 1.25),
    height: Math.round(size * 1.25),
    style: { display: "block", objectFit: "contain" }
  }), "GetEmployed");
}
Object.assign(__ds_scope, { Wordmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Wordmark.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Footer.jsx
try { (() => {
const defaultColumns = [{
  title: "Product",
  links: ["Job search", "Application tracker", "Resume builder", "Salary insights", "Pricing"]
}, {
  title: "For employers",
  links: ["Post a job", "Talent search", "Verified employer", "Hiring plans"]
}, {
  title: "Resources",
  links: ["Blog", "Interview guides", "Changelog", "GitHub"]
}, {
  title: "Company",
  links: ["About", "Careers", "Privacy", "Terms"]
}];
const GH = "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2";
function Footer({
  columns = defaultColumns,
  note = "© 2026 GetEmployed",
  githubUrl = "https://github.com/ashmit27j/get-employed",
  style
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--color-canvas)",
      borderTop: "1px solid var(--color-hairline)",
      padding: "64px 32px",
      fontSize: "var(--type-caption-size)",
      lineHeight: "var(--type-caption-lh)",
      color: "var(--color-ink-subtle)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "minmax(160px,1.4fr) repeat(" + columns.length + ",minmax(0,1fr))",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, note), githubUrl && /*#__PURE__*/React.createElement("a", {
    href: githubUrl,
    target: "_blank",
    rel: "noreferrer",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      color: "var(--color-ink-subtle)",
      width: "fit-content"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: GH
  })), "Star on GitHub")), columns.map(c => /*#__PURE__*/React.createElement("div", {
    key: c.title,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink)",
      fontWeight: 500
    }
  }, c.title), c.links.map(l => /*#__PURE__*/React.createElement("a", {
    key: l,
    href: l === "GitHub" && githubUrl ? githubUrl : "#",
    style: {
      color: "var(--color-ink-subtle)"
    }
  }, l))))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopNav.jsx
try { (() => {
function TopNav({
  links = ["Jobs", "Companies", "Resume", "Pricing", "Blog"],
  active,
  onNavigate,
  signInLabel = "Sign in",
  ctaLabel = "Get started",
  onSignIn,
  onCta,
  sticky = true,
  style
}) {
  const [hov, setHov] = React.useState(null);
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: sticky ? "sticky" : "relative",
      top: 0,
      zIndex: 10,
      height: "var(--nav-height)",
      background: "var(--color-canvas)",
      borderBottom: "1px solid var(--color-hairline)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: "var(--container-max)",
      margin: "0 auto",
      height: "100%",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      gap: 24,
      boxSizing: "border-box"
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNavigate && onNavigate("home");
    },
    style: {
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Wordmark, {
    size: 17
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      gap: 4
    }
  }, links.map((l, i) => {
    const on = active === l;
    return /*#__PURE__*/React.createElement("a", {
      key: l,
      href: "#",
      onClick: e => {
        e.preventDefault();
        onNavigate && onNavigate(l);
      },
      onMouseEnter: () => setHov(i),
      onMouseLeave: () => setHov(null),
      style: {
        fontSize: "var(--type-body-sm-size)",
        lineHeight: 1,
        padding: "8px 10px",
        borderRadius: "var(--rounded-md)",
        color: on || hov === i ? "var(--color-ink)" : "var(--color-ink-subtle)",
        position: "relative"
      }
    }, l, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 10,
        right: 10,
        bottom: -11,
        height: 1,
        background: "var(--color-primary)",
        boxShadow: "var(--glow-underline)"
      }
    }));
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, onSignIn && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    onClick: onSignIn
  }, signInLabel), /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    onClick: onCta
  }, ctaLabel))));
}
Object.assign(__ds_scope, { TopNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/logoMark.js
try { (() => {
const LOGO_MARK = "data:image/png;base64,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";
Object.assign(__ds_scope, { LOGO_MARK });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/logoMark.js", error: String((e && e.message) || e) }); }

// components/status/StatusBadge.jsx
try { (() => {
function StatusBadge({
  children,
  tone = "neutral",
  dot,
  style
}) {
  const showDot = dot ?? tone !== "neutral";
  const dotColor = tone === "success" ? "var(--color-semantic-success)" : tone === "accent" ? "var(--color-primary)" : "var(--color-ink-subtle)";
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: "var(--color-surface-2)",
      color: "var(--color-ink-muted)",
      fontFamily: "var(--font-text)",
      fontSize: "var(--type-caption-size)",
      lineHeight: "var(--type-caption-lh)",
      fontWeight: 500,
      padding: "2px 8px",
      borderRadius: "var(--rounded-pill)",
      border: "1px solid var(--color-hairline)",
      whiteSpace: "nowrap",
      ...style
    }
  }, showDot && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--rounded-full)",
      background: dotColor
    }
  }), children);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/status/ChangelogRow.jsx
try { (() => {
function ChangelogRow({
  version,
  date,
  title,
  items = [],
  tag
}) {
  return /*#__PURE__*/React.createElement("article", {
    style: {
      display: "grid",
      gridTemplateColumns: "160px minmax(0,1fr)",
      gap: 24,
      padding: "24px 0",
      borderBottom: "1px solid var(--color-hairline)",
      borderRadius: "var(--rounded-xs)",
      background: "var(--color-canvas)",
      color: "var(--color-ink)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--type-mono-size)",
      color: "var(--color-ink-muted)"
    }
  }, version), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-caption-size)",
      color: "var(--color-ink-subtle)"
    }
  }, date)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--type-card-title-size)",
      fontWeight: 500,
      letterSpacing: "var(--type-card-title-ls)",
      lineHeight: "var(--type-card-title-lh)"
    }
  }, title), tag && /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    tone: "success"
  }, tag)), items.length > 0 && /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 18,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      fontSize: "var(--type-body-size)",
      color: "var(--color-ink-muted)"
    }
  }, items.map(i => /*#__PURE__*/React.createElement("li", {
    key: i
  }, i)))));
}
Object.assign(__ds_scope, { ChangelogRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/ChangelogRow.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Changelog.jsx
try { (() => {
function Changelog() {
  const {
    ChangelogRow
  } = DS;
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 120,
      paddingBottom: 96,
      maxWidth: 880
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Changelog"), /*#__PURE__*/React.createElement(H2, null, "What's new")), /*#__PURE__*/React.createElement(ChangelogRow, {
    version: "v2.4.0",
    date: "Sep 18, 2026",
    title: "Salary insights",
    tag: "New",
    items: ["Median pay and range on every listing", "Filter search results by salary band"]
  }), /*#__PURE__*/React.createElement(ChangelogRow, {
    version: "v2.3.2",
    date: "Sep 04, 2026",
    title: "Tracker reminders",
    items: ["Follow-up nudges after 7 days in Applied", "Snooze a role for a week"]
  }), /*#__PURE__*/React.createElement(ChangelogRow, {
    version: "v2.3.0",
    date: "Aug 21, 2026",
    title: "Verified employers",
    items: ["Listings are checked against employer careers pages", "Expired roles removed daily"]
  }));
}
window.Changelog = Changelog;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Changelog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Figures.jsx
try { (() => {
const ISO = (x, y, z) => [(x - y) * 0.866, (x + y) * 0.5 - z];
const PTS = a => a.map(p => ISO(p[0], p[1], p[2]).map(n => n.toFixed(1)).join(",")).join(" ");
function boxFaces({
  x,
  y,
  z,
  w,
  d,
  h
}) {
  return {
    top: PTS([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]),
    left: PTS([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]),
    right: PTS([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])
  };
}
const box = (x, y, z, w, d, h, k, hi) => ({
  t: "box",
  x,
  y,
  z,
  w,
  d,
  h,
  k,
  hi
});
const ell = (z, r, k, hi, fill) => ({
  t: "ell",
  z,
  r,
  k,
  hi,
  fill
});
const ln = (a, b, k, hi) => ({
  t: "ln",
  a,
  b,
  k,
  hi
});
const SCENES = {
  search: s => {
    const it = [];
    for (let i = 0; i < 6; i++) it.push(box(-50, -50, i * (7 + 5 * s), 100, 100, 3, 2 + i * 2, i === 5));
    const top = 5 * (7 + 5 * s) + 3;
    it.push(ell(top + 14 + 16 * s, 32, 16, true, false), ell(top + 14 + 16 * s, 20, 18, true, false));
    return it;
  },
  match: s => [box(-44, -44, 18 + 30 * s, 38, 38, 38, 16, true), box(6, -44, 0, 38, 38, 38, 6), box(-44, 6, 0, 38, 38, 38, 6), box(6, 6, -6 * s, 38, 38, 38, 3)],
  tailor: s => {
    const it = [box(-55, -40, 0, 110, 80, 4, 3)];
    for (let i = 0; i < 4; i++) it.push(ln([-45, -28 + i * 16, 4], [40 - i % 2 * 28, -28 + i * 16, 4], 3));
    const z = 30 + 22 * s;
    it.push(box(-45, -50, z, 110, 80, 4, 14, true));
    for (let i = 0; i < 4; i++) it.push(ln([-35, -38 + i * 16, z + 4], [55 - i % 2 * 18, -38 + i * 16, z + 4], 14, true));
    return it;
  },
  outreach: s => {
    const it = [];
    for (let i = 0; i < 10; i++) it.push(box(-60 + i * (12 + 4 * s), -40, 0, 2, 80, 85 - i * 7, 14 - i * 1.2, i === 0));
    return it;
  },
  track: s => [28, 46, 36, 64, 22].map((h, i) => box(-75 + i * 30, -20, 0, 20, 40, h * (1 + 0.35 * s), 4 + i * 2.5, i === 3)),
  practice: s => {
    const it = [];
    [76, 60, 44, 28].forEach((r, i) => it.push(ell(-(3 - i) * 6 * s, r * (1 + 0.12 * s), 2 + i * 3, false, i === 3)));
    it.push(box(-12, -12, 0, 24, 24, 36 + 24 * s, 16, true));
    return it;
  }
};
function Shape({
  it,
  mx,
  my,
  on
}) {
  const tr = "translate(" + (mx * it.k).toFixed(2) + " " + (my * it.k).toFixed(2) + ")";
  const stroke = it.hi ? "var(--color-primary)" : on ? "var(--color-ink-subtle)" : "var(--color-ink-tertiary)";
  const base = {
    stroke,
    strokeWidth: 1,
    strokeLinejoin: "round",
    transition: "stroke .3s"
  };
  if (it.t === "box") {
    const f = boxFaces(it);
    return /*#__PURE__*/React.createElement("g", {
      transform: tr,
      style: base
    }, /*#__PURE__*/React.createElement("polygon", {
      points: f.left,
      style: {
        fill: "var(--color-canvas)"
      }
    }), /*#__PURE__*/React.createElement("polygon", {
      points: f.right,
      style: {
        fill: "var(--color-canvas)"
      }
    }), /*#__PURE__*/React.createElement("polygon", {
      points: f.top,
      style: {
        fill: it.hi ? "var(--color-surface-2)" : "var(--color-surface-1)"
      }
    }));
  }
  if (it.t === "ell") {
    const [X, Y] = ISO(0, 0, it.z);
    return /*#__PURE__*/React.createElement("ellipse", {
      transform: tr,
      cx: X,
      cy: Y,
      rx: it.r * 1.2247,
      ry: it.r * 0.7071,
      style: {
        ...base,
        fill: it.fill ? "var(--color-canvas)" : "none"
      }
    });
  }
  const [x1, y1] = ISO(...it.a),
    [x2, y2] = ISO(...it.b);
  return /*#__PURE__*/React.createElement("line", {
    transform: tr,
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    style: {
      ...base,
      opacity: 0.8
    }
  });
}
function useMouseLerp(ref, active) {
  const [v, setV] = React.useState({
    mx: 0,
    my: 0,
    s: 0
  });
  const tgt = React.useRef({
      mx: 0,
      my: 0,
      s: 0
    }),
    cur = React.useRef({
      mx: 0,
      my: 0,
      s: 0
    }),
    raf = React.useRef(0);
  const tick = () => {
    const c = cur.current,
      t = tgt.current;
    let moving = false;
    for (const k of ["mx", "my", "s"]) {
      const d = t[k] - c[k];
      if (Math.abs(d) > 0.002) {
        c[k] += d * 0.1;
        moving = true;
      } else c[k] = t[k];
    }
    setV({
      ...c
    });
    raf.current = moving ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => {
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };
  React.useEffect(() => {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = ref.current && ref.current.closest("[data-step]");
    if (!host) return;
    const f = e => {
      const r = host.getBoundingClientRect();
      tgt.current.mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      tgt.current.my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      kick();
    };
    const out = () => {
      tgt.current.mx = 0;
      tgt.current.my = 0;
      kick();
    };
    host.addEventListener("mousemove", f);
    host.addEventListener("mouseleave", out);
    return () => {
      host.removeEventListener("mousemove", f);
      host.removeEventListener("mouseleave", out);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);
  React.useEffect(() => {
    tgt.current.s = active ? 1 : 0;
    kick();
  }, [active]);
  return v;
}
function StepFigure({
  kind,
  active
}) {
  const ref = React.useRef(null);
  const {
    mx,
    my,
    s
  } = useMouseLerp(ref, active);
  const items = SCENES[kind](s);
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    style: {
      height: 210,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "-125 -150 250 220",
    style: {
      width: "100%",
      maxWidth: 280,
      height: "100%",
      overflow: "visible"
    },
    "aria-hidden": "true"
  }, items.map((it, i) => /*#__PURE__*/React.createElement(Shape, {
    key: i,
    it: it,
    mx: mx,
    my: my,
    on: active
  }))));
}
window.StepFigure = StepFigure;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Figures.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
function HeroHeadline() {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const a = setTimeout(() => setPhase(1), 5500),
      b = setTimeout(() => setPhase(2), 6200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  const out = phase === 1 ? " ge-wipeout" : "";
  return /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 80,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: "-3px",
      maxWidth: 900,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start"
    }
  }, phase < 2 ? /*#__PURE__*/React.createElement(React.Fragment, {
    key: "a"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ge-wipe" + out,
    style: {
      animationDelay: phase ? "0s" : "0.1s"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ge-un"
  }, "Un"), /*#__PURE__*/React.createElement("span", {
    className: "ge-sel"
  }, "employed"), "?"), /*#__PURE__*/React.createElement("span", {
    className: "ge-wipe" + out,
    style: {
      animationDelay: phase ? "0.08s" : "0.9s"
    }
  }, "Let's fix that.")) : /*#__PURE__*/React.createElement(React.Fragment, {
    key: "b"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ge-wipe",
    style: {
      animationDelay: "0s"
    }
  }, "Get", /*#__PURE__*/React.createElement("span", {
    className: "ge-sel",
    style: {
      animationDelay: "0.9s"
    }
  }, "Employed")), /*#__PURE__*/React.createElement("span", {
    className: "ge-wipe",
    style: {
      animationDelay: "0.3s"
    }
  }, "Today")));
}
function Home({
  go
}) {
  const {
    Button,
    TextInput,
    StatusBadge
  } = DS;
  const hero = React.useRef(null),
    mock = React.useRef(null);
  useScrollFx(hero, el => {
    const p = Math.min(1, Math.max(0, scrollY / 520));
    el.style.opacity = 1 - p * 0.7;
    el.style.transform = "translateY(" + -p * 40 + "px) scale(" + (1 - p * 0.04) + ")";
  });
  useScrollFx(mock, (el, r, vh) => {
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
    el.style.transform = "perspective(1400px) rotateX(" + ((1 - p) * 16).toFixed(2) + "deg) scale(" + (0.9 + p * 0.1).toFixed(3) + ")";
    el.style.opacity = 0.35 + p * 0.65;
  });
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: hero,
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 24,
      transformOrigin: "0 0"
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, {
    tone: "success"
  }, "40,000+ verified roles this week"), /*#__PURE__*/React.createElement(HeroHeadline, null), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 18,
      lineHeight: 1.5,
      letterSpacing: "-0.1px",
      color: "var(--color-ink-muted)",
      maxWidth: 560
    }
  }, "Search in plain English, get a tailored resume and an outreach email for every match, and practise the interview before it happens."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      width: "100%",
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement(TextInput, {
    placeholder: "e.g. React internships in Bengaluru, remote-friendly",
    iconLeft: /*#__PURE__*/React.createElement(Icon, {
      name: "search"
    }),
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: () => go("signup")
  }, "Search jobs")))), /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 72
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: mock,
    style: {
      transformOrigin: "50% 0",
      willChange: "transform"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 16,
      padding: 24
    }
  }, /*#__PURE__*/React.createElement(ProductMock, null)))), /*#__PURE__*/React.createElement(HowItWorks, null), /*#__PURE__*/React.createElement(SourceCarousel, null), /*#__PURE__*/React.createElement(Features, null), /*#__PURE__*/React.createElement(SelfHost, null), /*#__PURE__*/React.createElement(Testimonials, null), /*#__PURE__*/React.createElement(PricingSection, {
    go: go
  }), /*#__PURE__*/React.createElement(FAQ, null), /*#__PURE__*/React.createElement(FinalCTA, {
    go: go
  }));
}
window.Home = Home;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeSections.jsx
try { (() => {
const STEPS = [["search", "Search", "Describe the job in plain English", "Type “backend roles in Bengaluru, 12 LPA+, remote-friendly”. It becomes filter chips you can edit."], ["match", "Match", "A match score for every role", "Each job is scored 0–100 against your profile, with a one-line reason and the skills you’re missing."], ["tailor", "Tailor", "A resume written for the role", "Bullets are rewritten per job. You review the diff and the ATS score before anything is saved."], ["outreach", "Reach out", "Email the person who’s hiring", "Drafts wait in your outbox with the contact’s email and a confidence score. Nothing sends until you approve."], ["track", "Track", "Every application on one board", "Found, tailored, sent, replied, interview, offer. Cards move as replies come in."], ["practice", "Practice", "Rehearse the interview out loud", "A live voice mock interview, then a report on communication, accuracy, structure and confidence."]];
function Step({
  s,
  i
}) {
  const [on, setOn] = React.useState(false);
  const r = React.useRef(null);
  const hov = v => {
    setOn(v);
    const m = Mo();
    if (m && r.current && !reducedMotion()) m.animate(r.current, {
      transform: v ? "translateY(-6px)" : "translateY(0px)"
    }, {
      type: "spring",
      stiffness: 320,
      damping: 22
    });
  };
  const [kind, eb, t, b] = s;
  return /*#__PURE__*/React.createElement("div", {
    "data-step": "",
    onMouseEnter: () => hov(true),
    onMouseLeave: () => hov(false),
    style: {
      padding: "32px 32px 40px",
      borderLeft: i % 3 ? "1px solid var(--color-hairline)" : "none",
      borderTop: i > 2 ? "1px solid var(--color-hairline)" : "none",
      cursor: "default"
    }
  }, /*#__PURE__*/React.createElement(Reveal, {
    delay: i % 3 * 0.08
  }, /*#__PURE__*/React.createElement("div", {
    ref: r,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: "0.5px",
      color: on ? "var(--color-primary)" : "var(--color-ink-tertiary)",
      transition: "color .3s"
    }
  }, "0" + (i + 1) + " · " + eb.toUpperCase()), /*#__PURE__*/React.createElement(StepFigure, {
    kind: kind,
    active: on
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--color-ink)",
      marginTop: 12
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.6,
      color: "var(--color-ink-subtle)",
      maxWidth: 320,
      textWrap: "pretty"
    }
  }, b))));
}
function HowItWorks() {
  return /*#__PURE__*/React.createElement(Section, {
    id: "how"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "How it works"), /*#__PURE__*/React.createElement(H2, {
    style: {
      maxWidth: 760
    }
  }, "From one sentence to a booked interview."))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,minmax(0,1fr))"
    }
  }, STEPS.map((s, i) => /*#__PURE__*/React.createElement(Step, {
    key: s[0],
    s: s,
    i: i
  }))));
}
const SOURCES = [["LinkedIn", "lucide:linkedin"], ["Google Careers", "si:google"], ["Naukri", null], ["Indeed", "si:indeed"], ["Glassdoor", "si:glassdoor"], ["Wellfound", null], ["Instahyre", null], ["Cutshort", null], ["Foundit", null], ["Internshala", null], ["Hirist", null], ["Careers pages", "lucide:building-2"]];
function SourceIcon({
  src,
  name
}) {
  const [bad, setBad] = React.useState(false);
  const wrap = {
    width: 28,
    height: 28,
    flex: "none",
    borderRadius: "50%",
    background: "var(--color-surface-3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--color-ink-muted)"
  };
  if (src && src.startsWith("lucide:")) return /*#__PURE__*/React.createElement("span", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Icon, {
    name: src.slice(7),
    size: 14
  }));
  if (src && !bad) return /*#__PURE__*/React.createElement("span", {
    style: wrap
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://cdn.simpleicons.org/" + src.slice(3) + "/C3C8D1",
    alt: "",
    width: "14",
    height: "14",
    onError: () => setBad(true)
  }));
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...wrap,
      fontSize: 12,
      fontWeight: 600
    }
  }, name[0]);
}
function SourceCarousel() {
  const [paused, setPaused] = React.useState(false);
  const fade = "linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)";
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingTop: 72
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--color-ink-subtle)"
    }
  }, "Listings pulled from the boards you already use"), /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    style: {
      width: "100%",
      overflow: "hidden",
      WebkitMaskImage: fade,
      maskImage: fade
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, [0, 6].map((off, r) => {
    const row = [...SOURCES.slice(off), ...SOURCES.slice(0, off)];
    return /*#__PURE__*/React.createElement("div", {
      key: r,
      className: "ge-track",
      style: {
        display: "flex",
        width: "max-content",
        marginLeft: -r * 70,
        animationDelay: -r * 9 + "s",
        animationDuration: 45 + r * 6 + "s",
        animationPlayState: paused ? "paused" : "running"
      }
    }, [...row, ...row].map(([n, src], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        paddingRight: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "ge-pebble",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 16px 6px 6px",
        borderRadius: 999,
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-hairline)",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--color-ink-muted)",
        whiteSpace: "nowrap"
      }
    }, /*#__PURE__*/React.createElement(SourceIcon, {
      src: src,
      name: n
    }), n))));
  }))))));
}
function Sel({
  children
}) {
  const r = React.useRef(null);
  React.useEffect(() => {
    const el = r.current,
      m = Mo();
    if (!el) return;
    if (!m || reducedMotion()) {
      el.classList.add("on");
      return;
    }
    return m.inView(el, () => {
      setTimeout(() => el.classList.add("on"), 450);
    }, {
      amount: 1
    });
  }, []);
  return /*#__PURE__*/React.createElement("span", {
    ref: r,
    className: "ge-hl"
  }, children);
}
function MiniLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--color-ink-tertiary)",
      letterSpacing: "0.4px"
    }
  }, children);
}
function Tag({
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      padding: "2px 8px",
      borderRadius: 999,
      background: "var(--color-surface-3)",
      color: "var(--color-ink-muted)"
    }
  }, children);
}
function Features() {
  const {
    Card,
    Button
  } = DS;
  const cell = {
    background: "var(--color-canvas)",
    border: "1px solid var(--color-hairline)",
    borderRadius: 10,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontSize: 13
  };
  const rub = [["Communication", 82], ["Technical accuracy", 74], ["Structure", 68], ["Confidence", 79]];
  const cards = [["Job feed", "Know why a role fits before you open it", /*#__PURE__*/React.createElement("div", {
    style: cell
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink)",
      fontWeight: 500
    }
  }, "Backend Engineer \xB7 Razorpay"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink-subtle)"
    }
  }, "Bengaluru \xB7 \u20B918\u201326 LPA")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 28,
      color: "var(--color-primary)"
    }
  }, "92")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink-muted)"
    }
  }, "Your Go and Kafka projects cover 4 of 5 requirements."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Tag, null, "Missing: Kubernetes"), /*#__PURE__*/React.createElement(Tag, null, "gRPC")))], ["Resume tailor", "See every rewritten line", /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      fontFamily: "var(--font-mono)",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink-tertiary)",
      textDecoration: "line-through"
    }
  }, "\u2212 Worked on backend APIs for college fest app"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink)"
    }
  }, "+ Built a Go REST API serving 12k users during a 3-day college fest"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      color: "var(--color-ink-subtle)",
      fontFamily: "var(--font-sans)",
      fontSize: 13,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "ATS score"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "71 \u2192 "), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)"
    }
  }, "89"))))], ["Outbox", "Approve each email with one click", /*#__PURE__*/React.createElement("div", {
    style: cell
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      color: "var(--color-ink-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "To: ananya.k@zepto.co"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)"
    }
  }, "94% match")), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--color-ink)"
    }
  }, "Hi Ananya, I saw the SDE-1 opening on the payments team\u2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      justifyContent: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Edit"), /*#__PURE__*/React.createElement(Button, {
    size: "sm"
  }, "Approve & send")))], ["Interview report", "Scores you can improve on", /*#__PURE__*/React.createElement("div", {
    style: cell
  }, rub.map(([l, v]) => /*#__PURE__*/React.createElement("div", {
    key: l,
    style: {
      display: "grid",
      gridTemplateColumns: "140px 1fr 28px",
      alignItems: "center",
      gap: 10,
      color: "var(--color-ink-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", null, l), /*#__PURE__*/React.createElement("span", {
    style: {
      height: 4,
      borderRadius: 2,
      background: "var(--color-surface-3)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: v + "%",
      background: "var(--color-primary)",
      opacity: 0.4 + v / 200
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      textAlign: "right"
    }
  }, v))))]];
  return /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Inside the app"), /*#__PURE__*/React.createElement(H2, {
    style: {
      maxWidth: 760
    }
  }, "Built ", /*#__PURE__*/React.createElement(Sel, null, "for engineers"), ", by an engineer"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
      gap: 16
    }
  }, cards.map(([e, t, ui], i) => /*#__PURE__*/React.createElement(Reveal, {
    key: e,
    delay: i % 2 * 0.08
  }, /*#__PURE__*/React.createElement(Card, {
    eyebrow: e,
    title: t,
    style: {
      height: "100%",
      gap: 16
    }
  }, ui)))));
}
function SelfHost() {
  const {
    StatusBadge
  } = DS;
  const pts = ["Same app as the hosted version", "Your own LLM and email API keys", "No usage limits", "Your data stays on your machine"];
  return /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)",
      gap: 48,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(StatusBadge, null, "Open source"), /*#__PURE__*/React.createElement(H2, {
    style: {
      fontSize: 48
    }
  }, "Run it on your own machine."), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 17,
      lineHeight: 1.6,
      color: "var(--color-ink-subtle)",
      maxWidth: 480
    }
  }, "Clone the repo, add your keys, start it with Docker Compose. Everything the hosted plan does, without the quotas."), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      padding: 0,
      listStyle: "none",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontSize: 15,
      color: "var(--color-ink-muted)"
    }
  }, pts.map(p => /*#__PURE__*/React.createElement("li", {
    key: p,
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    style: {
      color: "var(--color-primary)"
    }
  }), p))))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 14,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: "12px 14px",
      borderBottom: "1px solid var(--color-hairline)"
    }
  }, [0, 1, 2].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--color-surface-4)"
    }
  }))), /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: "20px 22px",
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      lineHeight: 1.8,
      color: "var(--color-ink-muted)",
      whiteSpace: "pre-wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "$ "), "git clone ", REPO_URL, ".git", "\n", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "$ "), "cd get-employed && cp .env.example .env", "\n", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "$ "), "docker compose up -d", "\n", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)"
    }
  }, "\u2713"), " web      ready on http://localhost:3000", "\n", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)"
    }
  }, "\u2713"), " worker   scraping 12 sources", "\n", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-primary)"
    }
  }, "\u2713"), " db       healthy")))));
}
function Testimonials() {
  const {
    TestimonialCard
  } = DS;
  const t = [["I described what I wanted in one sentence and had thirty matched roles with reasons. Three interviews in two weeks.", "Aditi Sharma", "SDE-1, hired at a Bengaluru fintech"], ["The mock interviews were tough in a useful way. My structure score went from 54 to 81 before the real one.", "Rohan Iyer", "Backend Engineer, Pune"], ["I approved every outreach email myself and still got replies from two hiring managers in the first week.", "Sneha Reddy", "Final-year CSE, Hyderabad"]];
  const hl = React.useRef(null);
  React.useEffect(() => {
    const el = hl.current,
      m = Mo();
    if (!el) return;
    if (!m || reducedMotion()) {
      el.classList.add("on");
      return;
    }
    return m.inView(el, () => {
      setTimeout(() => el.classList.add("on"), 450);
    }, {
      amount: 1
    });
  }, []);
  return /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(H2, {
    style: {
      marginBottom: 40
    }
  }, "From others ", /*#__PURE__*/React.createElement("span", {
    ref: hl,
    className: "ge-hl"
  }, "like you"), ":")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
      gap: 16
    }
  }, t.map(([q, n, r], i) => /*#__PURE__*/React.createElement(Reveal, {
    key: n,
    delay: i * 0.08,
    style: {
      height: "100%",
      display: "grid"
    }
  }, /*#__PURE__*/React.createElement(TestimonialCard, {
    quote: q,
    name: n,
    role: r
  })))));
}
const FAQS = [["Is it free?", "Yes. The free plan includes 5 saved searches, 20 tailored resumes and 50 outreach emails a month, plus one mock interview. Pro removes the limits."], ["What’s the difference between hosted and self-hosted?", "It’s the same product. The self-hosted version runs on your machine with Docker Compose, uses your own API keys, and has no limits."], ["Will it send emails without asking me?", "No. Every draft waits in your outbox until you approve it."], ["Where do the jobs come from?", "Public listings on job boards and company careers pages, de-duplicated and refreshed daily."], ["Is it only for India?", "It starts with roles and salary data in India. More regions are planned."]];
function FAQ() {
  const [open, setOpen] = React.useState(0);
  return /*#__PURE__*/React.createElement(Section, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,0.8fr) minmax(0,1.2fr)",
      gap: 48
    }
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "FAQ"), /*#__PURE__*/React.createElement(H2, {
    style: {
      fontSize: 48
    }
  }, "Questions"))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.08
  }, /*#__PURE__*/React.createElement("div", null, FAQS.map(([q, a], i) => {
    const on = open === i;
    return /*#__PURE__*/React.createElement("div", {
      key: q,
      style: {
        borderBottom: "1px solid var(--color-hairline)"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(on ? -1 : i),
      style: {
        all: "unset",
        cursor: "pointer",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        padding: "20px 0",
        fontSize: 17,
        fontWeight: 500,
        color: on ? "var(--color-ink)" : "var(--color-ink-muted)"
      }
    }, q, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 16,
      style: {
        transition: "transform .4s cubic-bezier(.16,1,.3,1)",
        transform: on ? "rotate(45deg)" : "none",
        color: "var(--color-ink-subtle)"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateRows: on ? "1fr" : "0fr",
        transition: "grid-template-rows .5s cubic-bezier(.16,1,.3,1)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: "0 0 20px",
        fontSize: 15,
        lineHeight: 1.6,
        color: "var(--color-ink-subtle)",
        maxWidth: 600
      }
    }, a))));
  })))));
}
function FinalCTA({
  go
}) {
  const {
    Button
  } = DS;
  const h = React.useRef(null),
    sel = React.useRef(null);
  React.useEffect(() => {
    const m = Mo(),
      el = h.current;
    if (!m || !el || reducedMotion()) {
      sel.current && sel.current.classList.add("on");
      return;
    }
    const ls = el.querySelectorAll("[data-l]");
    ls.forEach(l => l.style.opacity = 0);
    return m.inView(el, () => {
      m.animate(ls, {
        opacity: [0, 1],
        transform: ["translateY(70%) rotate(8deg)", "translateY(0%) rotate(0deg)"],
        filter: ["blur(10px)", "blur(0px)"]
      }, {
        duration: 0.9,
        delay: m.stagger(0.04),
        ease: EASE
      });
      setTimeout(() => sel.current && sel.current.classList.add("on"), 1100);
    }, {
      amount: 0.5
    });
  }, []);
  const words = [["Get", false], ["Employed", true], ["Now!", false]];
  return /*#__PURE__*/React.createElement(Section, {
    style: {
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      position: "relative",
      overflow: "hidden",
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 20,
      padding: "112px 48px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 32,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    ref: h,
    "aria-label": "Get Employed Now!",
    style: {
      position: "relative",
      margin: 0,
      fontSize: 104,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: "-4px",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      columnGap: "0.25em"
    }
  }, words.map(([w, hi]) => /*#__PURE__*/React.createElement("span", {
    key: w,
    ref: hi ? sel : undefined,
    className: hi ? "ge-hl" : undefined,
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      position: "relative",
      color: "var(--color-ink)"
    }
  }, w.split("").map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    "data-l": "",
    style: {
      display: "inline-block"
    }
  }, c))))), /*#__PURE__*/React.createElement("p", {
    style: {
      position: "relative",
      margin: 0,
      fontSize: 18,
      color: "var(--color-ink-subtle)"
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--color-ink)",
      fontWeight: 600
    }
  }, "Free"), " to start. No credit card. Or self-host it tonight."), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go("Pricing")
  }, "See pricing"), /*#__PURE__*/React.createElement(Button, {
    onClick: () => go("signup")
  }, "Get started"))));
}
Object.assign(window, {
  Sel,
  HowItWorks,
  SourceCarousel,
  Features,
  SelfHost,
  Testimonials,
  FAQ,
  FinalCTA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeSections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Pricing.jsx
try { (() => {
function CloneBox() {
  const cmd = "git clone " + REPO_URL + ".git";
  const [ok, setOk] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard.writeText(cmd);
    } catch (e) {}
    setOk(true);
    setTimeout(() => setOk(false), 1600);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      padding: "16px 20px",
      borderRadius: 12,
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: 14,
      color: "var(--color-ink-muted)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "github",
    size: 16
  }), "Self-host from GitHub"), /*#__PURE__*/React.createElement("code", {
    style: {
      flex: 1,
      minWidth: 240,
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--color-ink)",
      padding: "8px 12px",
      borderRadius: 8,
      background: "var(--color-canvas)",
      border: "1px solid var(--color-hairline)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "$ "), cmd), /*#__PURE__*/React.createElement("button", {
    onClick: copy,
    style: {
      all: "unset",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: ok ? "var(--color-primary)" : "var(--color-ink-subtle)",
      padding: "8px 10px",
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: ok ? "check" : "copy",
    size: 14
  }), ok ? "Copied" : "Copy"));
}
function PricingSection({
  go,
  page
}) {
  const {
    PillTabs,
    PricingCard
  } = DS;
  const [p, setP] = React.useState("Yearly");
  const y = p === "Yearly";
  return /*#__PURE__*/React.createElement(Section, {
    id: "pricing",
    style: page ? {
      paddingTop: 120,
      paddingBottom: 120
    } : undefined
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 20,
      textAlign: "center",
      marginBottom: 48
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "Pricing"), /*#__PURE__*/React.createElement(H2, null, "Free to start. Pay to go unlimited."), /*#__PURE__*/React.createElement(PillTabs, {
    options: ["Monthly", "Yearly"],
    value: p,
    onChange: setP
  }))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.08
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,minmax(0,1fr))",
      gap: 16,
      alignItems: "stretch"
    }
  }, /*#__PURE__*/React.createElement(PricingCard, {
    tier: "Free",
    price: "\u20B90",
    period: "",
    description: "For getting started",
    cta: "Start free",
    onSelect: () => go("signup"),
    features: ["5 saved searches", "20 tailored resumes a month", "50 outreach emails a month", "1 mock interview"]
  }), /*#__PURE__*/React.createElement(PricingCard, {
    tier: "Pro",
    price: y ? "₹299" : "₹399",
    description: y ? "Billed yearly" : "Billed monthly",
    featured: true,
    cta: "Upgrade to Pro",
    onSelect: () => go("signup"),
    features: ["Unlimited searches and resumes", "Unlimited outreach emails", "Unlimited mock interviews with camera feedback", "Salary intelligence", "Career assistant chat"]
  }), /*#__PURE__*/React.createElement(PricingCard, {
    tier: "Self-host",
    price: "\u20B90",
    period: "",
    description: "Open source, your own API keys",
    cta: "View on GitHub",
    onSelect: () => window.open(REPO_URL, "_blank"),
    features: ["Everything in Pro", "No usage limits", "Runs with docker compose", "Your data stays on your machine"]
  })), /*#__PURE__*/React.createElement(CloneBox, null)));
}
function Pricing({
  go
}) {
  return /*#__PURE__*/React.createElement(PricingSection, {
    go: go,
    page: true
  });
}
Object.assign(window, {
  Pricing,
  PricingSection,
  CloneBox
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Pricing.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ProductMock.jsx
try { (() => {
const TOUR_DUR = 5200;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = x => 1 - Math.pow(1 - x, 3);
const mk = t => (s, d) => ease(clamp((t - s) / d));
const mono = {
  fontFamily: "var(--font-mono)",
  fontSize: 12
};
const fadeUp = v => ({
  opacity: v,
  transform: "translateY(" + (1 - v) * 8 + "px)"
});
const FEATURES = [{
  id: "search",
  icon: "search",
  label: "Search",
  title: "Verified roles only"
}, {
  id: "tracker",
  icon: "kanban-square",
  label: "Tracker",
  title: "Every application, one board"
}, {
  id: "resume",
  icon: "file-text",
  label: "Resume",
  title: "Tailored to each role"
}, {
  id: "alerts",
  icon: "bell",
  label: "Alerts",
  title: "Never miss a follow-up"
}, {
  id: "salary",
  icon: "bar-chart-3",
  label: "Salary",
  title: "Pay bands up front"
}];
function SearchView({
  t
}) {
  const {
    StatusBadge
  } = DS;
  const p = mk(t);
  const q = "Product designer, remote";
  const typed = q.slice(0, Math.floor(clamp(t / 1100) * q.length));
  const rows = [["Senior Product Designer", "Loop", "Remote · EU", "$142k – $168k"], ["Product Designer, Growth", "Parcel", "Remote · UK", "£78k – £92k"], ["Design Systems Lead", "Northwind", "Remote · IN", "₹58L – ₹72L"], ["Principal Designer", "Vela", "Remote · US", "$190k – $220k"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline-strong)",
      borderRadius: 8,
      padding: "8px 12px",
      boxShadow: t < 1300 ? "var(--focus-ring-shadow)" : "none",
      transition: "box-shadow .2s"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 15,
    style: {
      color: "var(--color-ink-subtle)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink)"
    }
  }, typed, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: t < 1300 && Math.floor(t / 400) % 2 === 0 ? 1 : 0,
      color: "var(--color-primary)"
    }
  }, "|")), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      ...mono,
      color: "var(--color-ink-subtle)",
      opacity: p(1200, 300)
    }
  }, "1,284 results")), rows.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r[0],
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) auto",
      gap: 12,
      alignItems: "center",
      padding: "10px 12px",
      border: "1px solid var(--color-hairline)",
      borderRadius: 8,
      background: "var(--color-surface-1)",
      ...fadeUp(p(1300 + i * 180, 350))
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-ink-subtle)"
    }
  }, r[1])), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-subtle)"
    }
  }, r[2]), /*#__PURE__*/React.createElement("span", {
    style: {
      ...mono,
      color: "var(--color-ink-muted)"
    }
  }, r[3]), /*#__PURE__*/React.createElement(StatusBadge, {
    tone: "success"
  }, "Verified"))));
}
function TrackerView({
  t
}) {
  const cols = ["Saved", "Applied", "Interview", "Offer"];
  const step = t < 1400 ? 1 : t < 2900 ? 2 : 3;
  const base = {
    Saved: ["Parcel · Growth", "Meridian · Brand"],
    Applied: ["Northwind · DS Lead", "Vela · Principal"],
    Interview: ["Loop · Senior PD"],
    Offer: []
  };
  const moved = cols[step];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,minmax(0,1fr))",
      gap: 10
    }
  }, cols.map(c => /*#__PURE__*/React.createElement("div", {
    key: c,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 10,
      padding: 10,
      minHeight: 230
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: 12,
      color: "var(--color-ink-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", null, c), /*#__PURE__*/React.createElement("span", {
    style: mono
  }, base[c].length + (moved === c ? 1 : 0))), base[c].map(x => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      padding: "8px 10px",
      borderRadius: 6,
      background: "var(--color-surface-2)",
      border: "1px solid var(--color-hairline)",
      fontSize: 12
    }
  }, x)), moved === c && /*#__PURE__*/React.createElement("div", {
    key: "h" + step,
    className: "ge-pop",
    style: {
      padding: "8px 10px",
      borderRadius: 6,
      background: "var(--color-surface-3)",
      border: "1px solid var(--color-primary)",
      boxShadow: "var(--glow-active)",
      fontSize: 12,
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", null, "Halcyon \xB7 Staff UX Eng"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: c === "Offer" ? "var(--color-semantic-success)" : "var(--color-ink-subtle)"
    }
  }, c === "Offer" ? "Offer received" : c === "Interview" ? "Onsite Thu 10:00" : "Applied today")))));
}
function ResumeView({
  t
}) {
  const p = mk(t);
  const score = Math.round(62 + 29 * p(600, 2000));
  const tips = ["Added “design systems” to summary", "Quantified impact: +18% activation", "Moved Figma + React to top skills"];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 10,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      fontSize: 12,
      color: "var(--color-ink-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      color: "var(--color-ink)",
      fontWeight: 500
    }
  }, "Priya Nair"), /*#__PURE__*/React.createElement("span", null, "Product Designer \xB7 Bengaluru"), ["Summary", "Experience", "Skills"].map((h, i) => /*#__PURE__*/React.createElement("div", {
    key: h,
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      letterSpacing: ".4px",
      textTransform: "uppercase"
    }
  }, h), [0, 1].map(j => {
    const hl = p(900 + i * 600, 400);
    return /*#__PURE__*/React.createElement("span", {
      key: j,
      style: {
        height: 8,
        borderRadius: 2,
        width: 88 - j * 22 - i * 6 + "%",
        background: j === 0 && hl > 0 ? "rgba(123,155,219," + (0.1 + 0.25 * hl) + ")" : "var(--color-surface-3)",
        transition: "background .3s"
      }
    });
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 10,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-ink-subtle)"
    }
  }, "Match score \xB7 Loop, Senior PD"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 40,
      fontWeight: 600,
      letterSpacing: "-1px",
      lineHeight: 1
    }
  }, score, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: "var(--color-ink-subtle)"
    }
  }, "/100")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      borderRadius: 9,
      background: "var(--color-surface-3)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: score + "%",
      background: "var(--color-primary)",
      boxShadow: "var(--glow-underline)"
    }
  }))), tips.map((x, i) => /*#__PURE__*/React.createElement("div", {
    key: x,
    style: {
      display: "flex",
      gap: 8,
      alignItems: "center",
      fontSize: 12,
      color: "var(--color-ink-muted)",
      ...fadeUp(p(900 + i * 600, 350))
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 14,
    style: {
      color: "var(--color-semantic-success)"
    }
  }), x))));
}
function AlertsView({
  t
}) {
  const p = mk(t);
  const items = [["sparkles", "New match", "Senior Product Designer at Loop · 94% match", "now"], ["clock", "Follow up", "Northwind has been in Applied for 7 days", "2h"], ["calendar", "Interview tomorrow", "Halcyon onsite · Thu 10:00", "5h"], ["trending-up", "Salary update", "Median for your role rose 4% this quarter", "1d"]];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, items.map(([ic, h, b, w], i) => {
    const v = p(300 + i * 700, 450);
    return /*#__PURE__*/React.createElement("div", {
      key: h,
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "12px 14px",
        background: i === 0 ? "var(--color-surface-2)" : "var(--color-surface-1)",
        border: "1px solid " + (i === 0 ? "var(--color-hairline-strong)" : "var(--color-hairline)"),
        borderRadius: 10,
        opacity: v,
        transform: "translateX(" + (1 - v) * 24 + "px)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "var(--color-surface-3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: i === 0 ? "var(--color-primary)" : "var(--color-ink-subtle)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 15
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", null, h), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: "var(--color-ink-subtle)"
      }
    }, b)), /*#__PURE__*/React.createElement("span", {
      style: {
        ...mono,
        color: "var(--color-ink-tertiary)"
      }
    }, w));
  }));
}
function SalaryView({
  t
}) {
  const p = mk(t);
  const g = p(300, 1400);
  const bars = [3, 6, 11, 17, 24, 21, 15, 9, 5, 2];
  const med = Math.round(118 + 37 * p(600, 1600));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 40,
      fontWeight: 600,
      letterSpacing: "-1px",
      lineHeight: 1,
      fontFamily: "var(--font-display)"
    }
  }, "$", med, "k"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--color-ink-subtle)"
    }
  }, "median \xB7 Senior Product Designer \xB7 Remote")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 6,
      height: 130,
      padding: "0 4px",
      borderBottom: "1px solid var(--color-hairline)"
    }
  }, bars.map((h, i) => {
    const on = i >= 3 && i <= 6;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        height: h / 24 * 100 * ease(clamp(g * 1.4 - i * 0.05)) + "%",
        borderRadius: "3px 3px 0 0",
        background: on ? "var(--color-primary)" : "var(--color-surface-4)",
        boxShadow: on && i === 4 ? "var(--glow-active)" : "none"
      }
    });
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      ...mono,
      color: "var(--color-ink-subtle)",
      opacity: p(1800, 400)
    }
  }, /*#__PURE__*/React.createElement("span", null, "$95k"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-muted)"
    }
  }, "p25 $142k"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-muted)"
    }
  }, "p75 $168k"), /*#__PURE__*/React.createElement("span", null, "$230k")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      ...fadeUp(p(2200, 400))
    }
  }, ["Based on 412 verified offers", "Updated weekly"].map(x => /*#__PURE__*/React.createElement("span", {
    key: x,
    style: {
      fontSize: 12,
      color: "var(--color-ink-subtle)",
      padding: "2px 8px",
      border: "1px solid var(--color-hairline)",
      borderRadius: 999
    }
  }, x))));
}
const VIEWS = {
  search: SearchView,
  tracker: TrackerView,
  resume: ResumeView,
  alerts: AlertsView,
  salary: SalaryView
};
function ProductMock() {
  const [idx, setIdx] = React.useState(0);
  const [t, setT] = React.useState(0);
  const [hover, setHover] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const stop = hover || paused;
  React.useEffect(() => {
    let raf,
      last = performance.now();
    const loop = now => {
      const dt = now - last;
      last = now;
      if (!stop) {
        setT(prev => {
          const n = prev + dt;
          if (n >= TOUR_DUR) {
            setIdx(i => (i + 1) % FEATURES.length);
            return 0;
          }
          return n;
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [stop]);
  const jump = i => {
    setIdx(i);
    setT(0);
  };
  const f = FEATURES[idx];
  const View = VIEWS[f.id];
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      background: "var(--color-canvas)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 12,
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "200px minmax(0,1fr)",
      minHeight: 400,
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      background: "var(--color-surface-1)",
      borderRight: "1px solid var(--color-hairline)",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, FEATURES.map((x, i) => {
    const on = i === idx;
    return /*#__PURE__*/React.createElement("button", {
      key: x.id,
      onClick: () => jump(i),
      style: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 10px",
        borderRadius: 6,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        fontSize: 13,
        background: on ? "var(--color-surface-3)" : "transparent",
        color: on ? "var(--color-ink)" : "var(--color-ink-subtle)",
        transition: "background .15s,color .15s"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: x.icon,
      size: 15,
      style: {
        color: on ? "var(--color-primary)" : "inherit"
      }
    }), x.label, on && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        bottom: 0,
        height: 1,
        width: t / TOUR_DUR * 100 + "%",
        background: "var(--color-primary)",
        boxShadow: "var(--glow-underline)"
      }
    }));
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 10px",
      color: "var(--color-ink-subtle)",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 9,
      background: "var(--color-semantic-success)"
    }
  }), "Open to work")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 16px",
      borderBottom: "1px solid var(--color-hairline)",
      color: "var(--color-ink-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink)",
      fontWeight: 500
    }
  }, f.label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-ink-tertiary)"
    }
  }, "/"), /*#__PURE__*/React.createElement("span", null, f.title), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 4
    }
  }, FEATURES.map((x, i) => /*#__PURE__*/React.createElement("span", {
    key: x.id,
    onClick: () => jump(i),
    style: {
      cursor: "pointer",
      width: 18,
      height: 3,
      borderRadius: 9,
      background: i < idx ? "var(--color-ink-tertiary)" : "var(--color-surface-4)",
      overflow: "hidden"
    }
  }, i === idx && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      height: "100%",
      width: t / TOUR_DUR * 100 + "%",
      background: "var(--color-primary)"
    }
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPaused(v => !v),
    "aria-label": paused ? "Play" : "Pause",
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      borderRadius: 6,
      border: "1px solid var(--color-hairline)",
      background: "var(--color-surface-1)",
      color: "var(--color-ink-subtle)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: paused ? "play" : "pause",
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    key: f.id,
    className: "ge-fade",
    style: {
      padding: 16,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(View, {
    t: t
  }))));
}
window.ProductMock = ProductMock;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ProductMock.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Shared.jsx
try { (() => {
const DS = window.GetEmployedDesignSystem_26a74c;
function Icon({
  name,
  size = 16,
  style
}) {
  const u = "url(https://unpkg.com/lucide-static@0.460.0/icons/" + name + ".svg) center/contain no-repeat";
  return /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-block",
      flex: "none",
      width: size,
      height: size,
      background: "currentColor",
      WebkitMask: u,
      mask: u,
      ...style
    }
  });
}
function Eyebrow({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: "0.4px",
      textTransform: "uppercase",
      color: "var(--color-ink-subtle)"
    }
  }, children);
}
function Section({
  children,
  style,
  id
}) {
  return /*#__PURE__*/React.createElement("section", {
    id: id,
    style: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: "120px 24px 0",
      boxSizing: "border-box",
      ...style
    }
  }, children);
}
function H2({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 56,
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-1.8px",
      textWrap: "balance",
      ...style
    }
  }, children);
}
const Mo = () => window.Motion;
const reducedMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
const EASE = [0.16, 1, 0.3, 1];
function Reveal({
  children,
  delay = 0,
  y = 32,
  style
}) {
  const r = React.useRef(null);
  React.useEffect(() => {
    const el = r.current,
      m = Mo();
    if (!el || !m || reducedMotion()) return;
    el.style.opacity = 0;
    return m.inView(el, () => {
      m.animate(el, {
        opacity: [0, 1],
        transform: ["translateY(" + y + "px) scale(.98)", "translateY(0px) scale(1)"],
        filter: ["blur(8px)", "blur(0px)"]
      }, {
        duration: 1,
        delay,
        ease: EASE
      });
    }, {
      amount: 0.15
    });
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    ref: r,
    style: style
  }, children);
}
function useScrollFx(ref, fn) {
  React.useEffect(() => {
    if (reducedMotion()) return;
    let q = 0;
    const run = () => {
      q = 0;
      const el = ref.current;
      if (el) fn(el, el.getBoundingClientRect(), innerHeight);
    };
    const on = () => {
      if (!q) q = requestAnimationFrame(run);
    };
    run();
    addEventListener("scroll", on, {
      passive: true
    });
    addEventListener("resize", on);
    return () => {
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
      cancelAnimationFrame(q);
    };
  }, []);
}
const REPO_URL = "https://github.com/ashmit27j/get-employed";
Object.assign(window, {
  DS,
  Icon,
  Eyebrow,
  Section,
  H2,
  Mo,
  reducedMotion,
  EASE,
  Reveal,
  useScrollFx,
  REPO_URL
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Shared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SignUp.jsx
try { (() => {
function SignUp({
  go
}) {
  const {
    Button,
    TextInput,
    Wordmark
  } = DS;
  const [done, setDone] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "calc(100vh - 56px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 400,
      background: "var(--color-surface-1)",
      border: "1px solid var(--color-hairline)",
      borderRadius: 12,
      padding: 32,
      boxShadow: "var(--edge-highlight)",
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Wordmark, {
    size: 17
  }), done ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-0.6px",
      lineHeight: 1.2
    }
  }, "Check your inbox"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--color-ink-subtle)",
      fontSize: 14
    }
  }, "We sent a sign-in link. It expires in 15 minutes."), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => go("home")
  }, "Back to home")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: "-0.6px",
      lineHeight: 1.2
    }
  }, "Create your account"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: "var(--color-ink-subtle)",
      fontSize: 14
    }
  }, "Free for candidates.")), /*#__PURE__*/React.createElement(TextInput, {
    label: "Full name",
    placeholder: "Priya Nair"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Email",
    type: "email",
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement(TextInput, {
    label: "Target role",
    placeholder: "e.g. Product Designer",
    hint: "Used to tune your job alerts."
  }), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    onClick: () => setDone(true)
  }, "Continue"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 12,
      color: "var(--color-ink-tertiary)"
    }
  }, "By continuing you agree to the Terms and Privacy Policy."))));
}
window.SignUp = SignUp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SignUp.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.CTABanner = __ds_scope.CTABanner;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PricingCard = __ds_scope.PricingCard;

__ds_ns.TestimonialCard = __ds_scope.TestimonialCard;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.PillTabs = __ds_scope.PillTabs;

__ds_ns.TopNav = __ds_scope.TopNav;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.LOGO_MARK = __ds_scope.LOGO_MARK;

__ds_ns.ChangelogRow = __ds_scope.ChangelogRow;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

})();
