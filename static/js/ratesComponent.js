//arsrates-static/static/js/ratesComponent.js
const RateChangeDisplay = ({ change }) => {
    if (!change && change !== 0) return null;
    
    const isFlat = change === 0 || Math.abs(change) < 0.05;
    const isPositive = change > 0;
    
    if (isFlat) {
        return React.createElement('div', {
            style: {
                width: '100%',
                paddingLeft: '16px'
            }
        },
        React.createElement('span', {
            className: 'text-muted',
            style: {
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                minWidth: '54px',
                textAlign: 'left'
            }
        }, '−')  // Just show the dash for flat rates
        );
    }
    
    const Arrow = isPositive ? '▲' : '▼';
    return React.createElement('div', {
        style: {
            width: '100%',
            paddingLeft: '16px'
        }
    },
        React.createElement('span', {
            className: isPositive ? 'text-success' : 'text-danger',
            style: {
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                minWidth: '54px',
                textAlign: 'left'
            }
        }, `${Arrow} ${Math.abs(change).toFixed(1)}%`)
    );
};

const RateDisplay = ({ 
    title,
    currentRate,
    previousRate,
    rateType,
    projected = false
}) => {
    if (!currentRate) return null;

    const calculateComparisonRates = () => {
        try {
            if (rateType === 'BUY_SELL') {
                const currentMid = (currentRate.buy + currentRate.sell) / 2;
                const prevMid = previousRate ? (previousRate.buy + previousRate.sell) / 2 : null;
                return { current: currentMid, previous: prevMid };
            }
            return { current: currentRate, previous: previousRate };
        } catch (error) {
            console.error('Error calculating comparison rates:', error);
            return { current: null, previous: null };
        }
    };

    const { current, previous } = calculateComparisonRates();
    if (!current) return null;

    const change = previous ? ((current - previous) / previous) * 100 : null;

    // Get URL based on rate type
    const getRateUrl = () => {
        switch (title) {
            case 'Mastercard':
                return 'https://www.mastercard.us/en-us/personal/get-support/convert-currency.html';
            case 'Visa':
                return 'https://usa.visa.com/support/consumer/travel-support/exchange-rate-calculator.html';
            case 'Western Union':
                return 'https://www.westernunion.com/us/en/currency-converter/usd-to-ars-rate.html';
            default:
                return 'https://dolarhoy.com';
        }
    };

    const rateValueContent = rateType === 'BUY_SELL' ? 
        React.createElement('div', null, [
            React.createElement('div', { 
                style: { fontSize: '0.95rem', whiteSpace: 'nowrap' }
            }, `${currentRate.buy.toFixed(0)}/${currentRate.sell.toFixed(0)}`),
            React.createElement('div', { 
                className: "text-muted",
                style: { fontSize: '0.75rem' }
            }, `Mid: ${current.toFixed(1)}`)
        ]) :
        React.createElement('div', { 
            style: { fontSize: '0.95rem', whiteSpace: 'nowrap' }
        }, current.toFixed(1));

    return React.createElement('div', { 
        className: "list-group-item py-1"
    },
        React.createElement('div', { 
            style: {
                display: 'grid',
                gridTemplateColumns: '135px 100px 70px',
                gap: '0',
                alignItems: 'center'
            }
        }, [
            // Rate Name Column
            React.createElement('div', { 
                style: { 
                    width: '100%',
                    fontSize: '0.875rem',
                    color: '#333',
                    paddingLeft: '8px',
                    display: 'flex',  // Add this to allow inline alignment
                    alignItems: 'center' // Vertically center the title and proj label
                }
            }, [
                title,
                projected && React.createElement('span', { 
                    className: "text-muted",
                    style: { 
                        fontSize: '0.75rem',  // Smaller font
                        marginLeft: '4px'     // Space between title and (Proj)
                    }
                }, "(Proj)")
            ]),
            
            // Rates Column
            React.createElement('div', { 
                style: { 
                    width: '100%',
                    textAlign: 'right',
                    paddingRight: '8px'
                }
            }, [
                React.createElement('a', {
                    href: getRateUrl(),
                    target: '_blank',
                    style: { 
                        textDecoration: 'none',
                        color: 'inherit'
                    },
                    className: 'rate-link'
                }, [rateValueContent])
            ]),
            
            // Change Column
            React.createElement('div', { 
                style: { 
                    width: '100%',
                    textAlign: 'left'
                }
            }, [
                React.createElement(RateChangeDisplay, { change: change })
            ])
        ])
    );
};

const RatesContainer = () => {
    const [rates, setRates] = React.useState({
        current: null,
        previous: null,
        labels: {}
    });

    React.useEffect(() => {
        const fetchRates = async () => {
            try {
                const [currentResponse, comparisonResponse] = await Promise.all([
                    fetch('/static/data/current_rates.json'),
                    fetch(`${window.APP_CONFIG.API_BASE_URL}/api/rates/comparison`)
                ]);

                if (!currentResponse.ok || !comparisonResponse.ok) {
                    throw new Error('Failed to fetch rates');
                }

                const currentData = await currentResponse.json();
                const comparisonData = await comparisonResponse.json();

                setRates({
                    current: currentData.rates,
                    previous: comparisonData.previous,
                    labels: currentData.labels
                });

                const lastUpdatedElement = document.getElementById('last-updated');
                if (lastUpdatedElement && currentData.last_updated) {
                    const date = new Date(currentData.last_updated);
                    lastUpdatedElement.textContent = `Last Updated: ${date.toLocaleString()}`;
                }
            } catch (error) {
                console.error('Error fetching rates:', error);
            }
        };

        fetchRates();
        const interval = setInterval(fetchRates, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!rates.current) {
        return React.createElement('div', { className: "alert alert-info" }, 'Loading rates...');
    }

    const shouldProjectMC = () => {
        const now = new Date();
        const estHour = now.getUTCHours() - 5;
        return estHour < 15;
    };

    const getProjectedMCRate = () => rates.current.VISA;

    // Column headers with consistent widths and grid layout
    const headers = React.createElement('div', {
        className: "list-group-item py-2 bg-light",
        style: {
            width: '100%'  // Ensure header width matches content
        }    
    }, 
        React.createElement('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: '135px 100px 70px',
                gap: '0',
                alignItems: 'center'
            }
        }, [
            React.createElement('div', {
                style: { 
                    width: '100%',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    paddingLeft: '8px'
                }
            }, "Rate Type"),
            React.createElement('div', {
                style: { 
                    width: '100%',
                    textAlign: 'right',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    paddingRight: '8px'
                }
            }, "Buy/Sell (Mid)"),
            React.createElement('div', {
                style: { 
                    width: '100%',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    paddingLeft: '8px'
                }
            }, "24h Chg")
        ])
    );

    const rateDisplays = [
        { title: "Dólar Blue", type: "BUY_SELL", rate: rates.current.BLUE, prevRate: rates.previous?.BLUE },
        { title: "Dólar Official", type: "BUY_SELL", rate: rates.current.OFFICIAL, prevRate: rates.previous?.OFFICIAL },
        { title: "Western Union", type: "SINGLE", rate: rates.current.WU, prevRate: rates.previous?.WU },
        { title: "Visa", type: "SINGLE", rate: rates.current.VISA, prevRate: rates.previous?.VISA },
        { title: "Mastercard", type: "SINGLE", rate: rates.current.MC || (shouldProjectMC() && getProjectedMCRate()), prevRate: rates.previous?.MC, projected: !rates.current.MC && shouldProjectMC() },
        { title: "Dólar Tarjeta", type: "SINGLE", rate: rates.current.TARJETA, prevRate: rates.previous?.TARJETA },
        { title: "Dólar Cripto", type: "BUY_SELL", rate: rates.current.CRYPTO, prevRate: rates.previous?.CRYPTO },
        { title: "Dólar CCL", type: "BUY_SELL", rate: rates.current.CCL, prevRate: rates.previous?.CCL },
        { title: "Dólar MEP", type: "BUY_SELL", rate: rates.current.MEP, prevRate: rates.previous?.MEP }

    ];

    return React.createElement('div', {
        style: {
            maxWidth: '345px',  // Adjust based on your column widths total + padding
            margin: '0 auto'    // Center the container
        },
        className: "rates-container" 
    }, [
        headers,
        ...rateDisplays.map(display => 
            React.createElement(RateDisplay, {
                title: display.title,
                currentRate: display.rate,
                previousRate: display.prevRate,
                rateType: display.type,
                projected: display.projected
            })
        )
    ]);
};

window.RatesContainer = RatesContainer;