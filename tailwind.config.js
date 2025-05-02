module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
      ],
    theme: {
      extend: {
        colors: {
          generate: '#0078cd',
        },
      },
    },
    purge: [],
    darkMode: false, // or 'media' or 'class'
    variants: {
      extend: {},
    },
    plugins: [],
}