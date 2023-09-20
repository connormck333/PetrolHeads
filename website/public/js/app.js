const tl = gsap.timeline({defaults: {ease: "power1.out"}});

tl.to(".title-text", {y: "0%", duration: 1, stagger: 0.25});
const hiddenHeaderEls = document.getElementsByClassName("hide-header");

for (let i=0; i < hiddenHeaderEls.length; i++) {
  const item = hiddenHeaderEls[i];
  item.style.backgroundColor = 'transparent';
}

tl.fromTo('.bkg-img', 2, {opacity: 0}, {opacity: 1});
