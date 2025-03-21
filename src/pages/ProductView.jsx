import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./styles/ProductView.css";
import "./styles/BestSelling.css";

import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import left from "./images/left.png";
import right from "./images/right.png";

gsap.registerPlugin(ScrollTrigger);

const ProductView = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedColor, setSelectedColor] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [proDetails, setProDetails] = useState(false);
    const [shippingDetails, setShippingDetails] = useState(false);
    const [randomProducts, setRandomProducts] = useState([]);

    const buyNowRef = useRef(null);
    const proDetailsRef = useRef(null);
    const detailsRef = useRef(null);

    // const proDetailsRef = useRef(null);

    useEffect(() => {
        if (proDetails) {
            gsap.fromTo(
                proDetailsRef.current,
                { x: "-100%", opacity: 0 },
                { x: "0%", opacity: 1, duration: 0.5, ease: "power2.out" }
            );
        } else {
            gsap.to(proDetailsRef.current, {
                x: "100%",
                opacity: 0,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    if (proDetailsRef.current) {
                        proDetailsRef.current.style.display = "none";
                    }
                },
            });
        }
    }, [proDetails]);


    useEffect(() => {
        if (shippingDetails) {
            gsap.fromTo(
                detailsRef.current,
                { x: "-100%", opacity: 0 },
                { x: "0%", opacity: 1, duration: 0.5, ease: "power2.out" }
            );
        } else {
            gsap.to(detailsRef.current, {
                x: "100%",
                opacity: 0,
                duration: 0.5,
                ease: "power2.in",
                onComplete: () => {
                    if (detailsRef.current) {
                        detailsRef.current.style.display = "none"; // Hide after animation
                    }
                },
            });
        }
    }, [shippingDetails]);



    useEffect(() => {
        if (!buyNowRef.current) return;

        const buyNow = buyNowRef.current;

        gsap.fromTo(
            buyNow,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, duration: 1, ease: "power2.out" }
        );

        ScrollTrigger.create({
            trigger: buyNow,
            start: "top bottom",
            end: "top 50%",
            onEnter: () => gsap.to(buyNow, { y: 0, opacity: 1, duration: 0.5 }),
            onLeave: () => gsap.to(buyNow, { y: 100, opacity: 0, duration: 0.5 }),
            onEnterBack: () => gsap.to(buyNow, { y: 0, opacity: 1, duration: 0.5 }),
            onLeaveBack: () => gsap.to(buyNow, { y: 100, opacity: 0, duration: 0.5 }),
        });

        return () => ScrollTrigger.refresh();
    }, [product]);



    useEffect(() => {
        axios.get(`http://localhost:5000/api/products/${id}`)
            .then(response => {
                console.log("Fetched Product Data:", response.data);
                const data = response.data;

                const saveAmount = data.product_price && data.dis_product_price
                    ? data.product_price - data.dis_product_price
                    : 0;

                const images = data.colors.map(color => ({
                    url: data.product_image,
                    filter: color.filter || "none",
                    color: color
                }));

                setProduct({ ...data, images, save: saveAmount });
                setSelectedColor(data.colors?.[0] || null);
            })
            .catch(error => console.error("Error fetching product:", error));
    }, [id]);




    const changeImage = (index) => {
        setCurrentIndex(index);
        setSelectedColor(product.colors[index]);
    };

    const nextImage = () => {
        const newIndex = (currentIndex + 1) % product.images.length;
        changeImage(newIndex);
    };

    const prevImage = () => {
        const newIndex = (currentIndex - 1 + product.images.length) % product.images.length;
        changeImage(newIndex);
    };

    const selectImage = (index) => {
        setCurrentIndex(index);
    };

    const increaseQuantity = () => {
        setQuantity((prev) => prev + 1);
    };

    const decreaseQuantity = () => {
        setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
    };
    const selectColor = (color, index) => {
        setSelectedColor(color);
        setCurrentIndex(index + 1);
    };

    useEffect(() => {
        axios.get("http://localhost:5000/api/products/bestselling")
            .then(response => {
                const allProducts = response.data;
                const filteredProducts = allProducts.filter(p => p._id !== id);
                const shuffled = filteredProducts.sort(() => 0.5 - Math.random());
                setRandomProducts(shuffled.slice(0, 6));
            })
            .catch(error => console.error("Error fetching products:", error));
    }, [id]);


    if (!product || !product.images || product.images.length === 0) {
        return <p>Loading...</p>;
    }

    return (
        <>
            <div className="product-view-page">
                <div className="product-view">
                    <div className="product-view-frame">
                        <div className="product-images">
                            <div className="images-frame">
                                <div className="left-icon-img" onClick={prevImage}>
                                    <img src={left} className="left-icon" alt="Previous" />
                                </div>
                                <div className="right-icon-img" onClick={nextImage}>
                                    <img src={right} className="right-icon" alt="Next" />
                                </div>
                                <img
                                    src={`/images/${product.images[currentIndex].url}`}
                                    className="img"
                                    alt={product.product_name}
                                    style={{ filter: product.images[currentIndex].filter }}
                                />
                                <div className="pi_dot">
                                    {product.images.map((_, index) => (
                                        <span
                                            key={index}
                                            className={`dot ${index === currentIndex ? "active-dot" : ""}`}
                                            onClick={() => changeImage(index)}
                                        ></span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="product-data">
                            <p className="Free-Delivery"><span class="material-symbols-outlined">
                                local_shipping
                            </span> Free Delivery</p>
                            <div className="data-frame">
                                <h2>{product.product_name}</h2>
                                <p className="type"><span>Type </span>{product.p_type}</p>
                                <p className="des"><span>Product Description </span>{product.p_des}</p>
                                <div className="hr"></div>
                                {product.dis_product_price ? (
                                    <div className="discount-box">
                                        <p className="original-price">${product.product_price}</p>
                                        <p className="price">${product.dis_product_price}</p>
                                        <p className="save">Save {Math.round((product.save / product.product_price) * 100)}%</p>
                                    </div>
                                ) : (
                                    <div className="price-box">
                                        <p className="price">${product.product_price}</p>
                                    </div>
                                )}

                                {product.colors && (
                                    <div className="color-selection">
                                        <div className="colors">
                                            {product.colors.map((color, index) => (
                                                <span
                                                    key={index}
                                                    className={`color-box ${selectedColor === color ? "active" : ""}`}
                                                    style={{ backgroundColor: color.color_code }}
                                                    onClick={() => changeImage(index)}
                                                ></span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="quantity-addtocart">
                                    <div className="quantity">
                                        <button className="quantity-btn decreaseQuantity" onClick={decreaseQuantity}>-</button>
                                        <span className="quantity-input">{quantity}</span>
                                        <button className="quantity-btn" onClick={increaseQuantity}>+</button>
                                    </div>
                                    <div className="add-to-cart">
                                        <button>Add to Cart</button>
                                    </div>
                                </div>
                                <div className="hr"></div>
                                <div className={`product-details-shipping ${proDetails ? "active-border" : ""}`}
                                    onClick={() => setProDetails(!proDetails)}
                                >
                                    <div className="heading-arrow_down">
                                        <h4>
                                            Product Detail
                                        </h4>
                                        <span className="material-symbols-outlined">
                                            keyboard_arrow_down
                                        </span>
                                    </div>
                                    <div ref={proDetailsRef} className="data-shipping-product"
                                        style={{ display: proDetails ? "block" : "none" }}
                                    >
                                        {proDetails && product.product_details.map((detail, index) => (
                                            <li key={index}>{detail}</li>
                                        ))}
                                    </div>


                                </div>
                                <div className={`product-details-shipping shipping ${shippingDetails ? "active-border" : ""}`}
                                    onClick={() => setShippingDetails(!shippingDetails)}
                                >
                                    <div className="heading-arrow_down">
                                        <h4>
                                            Shipping & Returns
                                        </h4>
                                        <span className="material-symbols-outlined">
                                            keyboard_arrow_down
                                        </span>
                                    </div>
                                    {shippingDetails && (
                                        <div ref={detailsRef} className={`data-shipping-product`}
                                            style={{ display: shippingDetails ? "block" : "none" }}
                                        >
                                            <li>Express and fast delivery all over Pakistan (Avg. Time 1-3 days).</li>
                                            <li>Hassle Free exchange if there is any size issue.</li>
                                            <li>Free Delivery on orders over Rs. 2,990/-</li>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                {product && <Link ref={buyNowRef} className="buy-now">Buy Now</Link>}
                <div className="other-products">
                    <div className="best-selling-section">
                        <div className="product-container">
                            <h2>Related Products</h2>
                            <div className="products-grid">
                                {randomProducts.length > 0 ? (
                                    randomProducts.map((p) => {
                                        const hasDiscount = p.dis_product_price !== undefined;

                                        return (
                                            <div key={p._id} className="product-card">
                                                <div className="product-image-wrapper">
                                                    <img src={`/images/${p.product_image}`} className="bsp-img" alt={p.product_name} />
                                                </div>
                                                <div className="product-details">
                                                    <h3>{p.product_name}</h3>
                                                    {hasDiscount ? (
                                                        <p className="product-price dual-price">
                                                            <span className="original-price">${p.product_price}</span>
                                                            <span className="discount-price">${p.dis_product_price}</span>
                                                        </p>
                                                    ) : (
                                                        <p className="product-price">${p.product_price}</p>
                                                    )}
                                                    <Link to={`/product/${p._id}`} className="shop-now">
                                                        Buy Now
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>Loading random products...</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
};

export default ProductView;