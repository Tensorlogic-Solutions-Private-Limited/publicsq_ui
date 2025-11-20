<script>
    export let width = 'w-full';
    export let height = 'h-1';
    export let bgColor = 'bg-gray-200';
    export let loaderColor = 'bg-accent';
    export let duration = 'duration-1000';
  </script>
  
  <div class="relative {width} {height} {bgColor} overflow-hidden rounded-full">
    <div class="absolute top-0 h-full w-full {loaderColor} rounded-full animate-line-loader"></div>
  </div>
  
  <style>
    @keyframes lineLoader {
      0% {
        left: -100%;
      }
      50% {
        left: 100%;
      }
      100% {
        left: -100%;
      }
    }
  
    .animate-line-loader {
      animation: lineLoader 3s ease-in-out infinite;
    }
  </style>