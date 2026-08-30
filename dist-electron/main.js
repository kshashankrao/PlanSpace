import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n } from "electron";
import r from "node:path";
import { fileURLToPath as i } from "node:url";
//#region \0rolldown/runtime.js
var a = /* @__PURE__ */ e(import.meta.url), o = r.dirname(i(import.meta.url));
process.env.APP_ROOT = r.join(o, "..");
var s = process.env.VITE_DEV_SERVER_URL, c = r.join(process.env.APP_ROOT, "dist-electron"), l = r.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = s ? r.join(process.env.APP_ROOT, "public") : l;
var u;
function d() {
	u = new t({
		width: 1200,
		height: 800,
		minWidth: 800,
		minHeight: 600,
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#ffffff",
			symbolColor: "#000000"
		},
		webPreferences: {
			preload: r.join(o, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), s ? u.loadURL(s) : u.loadFile(r.join(l, "index.html")), u.webContents.setWindowOpenHandler(({ url: e }) => (e.startsWith("http") && a("electron").shell.openExternal(e), { action: "deny" }));
}
n.on("window-all-closed", () => {
	process.platform !== "darwin" && (n.quit(), u = null);
}), n.on("activate", () => {
	t.getAllWindows().length === 0 && d();
}), n.whenReady().then(d);
//#endregion
export { c as MAIN_DIST, l as RENDERER_DIST, s as VITE_DEV_SERVER_URL };
