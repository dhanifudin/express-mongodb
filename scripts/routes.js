const userRouter = require("../routes/users");
const postRouter = require("../routes/posts");
const paymentRouter = require("../routes/payments");

const mounts = [
  { prefix: "/users", router: userRouter },
  { prefix: "/posts", router: postRouter },
  { prefix: "/payments", router: paymentRouter },
];

const routes = [];

mounts.forEach(({ prefix, router }) => {
  router.stack.forEach((layer) => {
    if (layer.route) {
      Object.keys(layer.route.methods).forEach((method) => {
        routes.push({ method: method.toUpperCase(), path: prefix + layer.route.path });
      });
    }
  });
});

const methodWidth = Math.max(...routes.map((r) => r.method.length));

console.log("");
routes.forEach(({ method, path }) => {
  console.log(`  ${method.padEnd(methodWidth)}  ${path}`);
});
console.log("");
