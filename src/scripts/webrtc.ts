// Use global i18n system for static deployment
const t = (key: string) => (window as any).ZeroCallI18n?.t(key) || key;
const applyTranslations = () => (window as any).ZeroCallI18n?.applyTranslations();
const onLocaleChange = (cb: () => void) => (window as any).ZeroCallI18n?.onLocaleChange(cb);

const localVideo = document.getElementById('local-video') as HTMLVideoElement;
const remoteVideo = document.getElementById('remote-video') as HTMLVideoElement;
const createInviteBtn = document.getElementById('create-invite')! as HTMLButtonElement;
const acceptInviteBtn = document.getElementById('accept-invite')! as HTMLButtonElement;
const responseContainer = document.getElementById('response-container')!;
const responseCodeInput = document.getElementById('response-code')! as HTMLInputElement;
const submitResponseBtn = document.getElementById('submit-response')! as HTMLButtonElement;
const callActions = document.getElementById('call-actions') as HTMLDivElement;
const micToggleBtn = document.getElementById('mic-toggle') as HTMLButtonElement;
const camToggleBtn = document.getElementById('cam-toggle') as HTMLButtonElement;
const errorModal = document.getElementById('error-modal')!;
const errorMessage = document.getElementById('error-message')!;
const closeModalBtn = document.getElementById('close-modal')! as HTMLButtonElement;
const toastContainer = document.getElementById('toast-container')!;

let localStream: MediaStream;
let peerConnection: RTCPeerConnection;

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};



const showToast = (message: string) => {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    toastContainer.appendChild(toast);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 3000); // Display for 3 seconds
};

const createInvitation = async () => {
    try {
        createInviteBtn.disabled = true;
        peerConnection = new RTCPeerConnection(configuration);

        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }

        peerConnection.ontrack = event => {
            remoteVideo.srcObject = event.streams[0];
        };

        const iceGatheringPromise = new Promise<void>(resolve => {
            let resolved = false;
            const resolveOnce = () => {
                if (!resolved) {
                    resolved = true;
                    resolve();
                }
            };

            setTimeout(resolveOnce, 2000);

            peerConnection.onicecandidate = event => {
                if (!event.candidate) {
                    resolveOnce();
                }
            };
        });

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        await iceGatheringPromise;

        const finalOffer = peerConnection.localDescription;
        if (finalOffer) {
            const encodedOffer = btoa(JSON.stringify(finalOffer));
            const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${encodedOffer}`;

            navigator.clipboard.writeText(inviteUrl).then(() => {
                showToast(t('invitation_link_copied'));
            }).catch(err => {
                console.error('Could not copy link: ', err);
                showError(t('failed_to_copy_link'));
            });



            createInviteBtn.style.display = 'none';
            responseContainer.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        showError(t('failed_to_create_invitation'));
    }
};

const showError = (message: string) => {
    errorMessage.textContent = message;
    errorModal.style.display = 'flex';
};

const acceptInvitation = async (encodedOffer: string) => {
    createInviteBtn.style.display = 'none';
    acceptInviteBtn.style.display = 'block';

    acceptInviteBtn.onclick = async () => {
        await startLocalVideo();

        try {
            const offer = JSON.parse(atob(encodedOffer));
            peerConnection = new RTCPeerConnection(configuration);

            if (localStream) {
                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });
            }

            peerConnection.ontrack = event => {
                const [remoteStream] = event.streams;
                remoteVideo.srcObject = remoteStream;
                setupSpeakingIndicator(remoteStream);
                callActions.style.display = 'flex';
            };

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            const iceGatheringPromise = new Promise<void>(resolve => {
                let resolved = false;
                const resolveOnce = () => {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                };

                setTimeout(resolveOnce, 2000);

                peerConnection.onicecandidate = event => {
                    if (!event.candidate) {
                        resolveOnce();
                    }
                };
            });

            await iceGatheringPromise;

            const finalAnswer = peerConnection.localDescription;
            if (finalAnswer) {
                const encodedResponse = btoa(JSON.stringify(finalAnswer));

                navigator.clipboard.writeText(encodedResponse).then(() => {
                    showToast(t('response_code_copied'));
                }).catch(err => {
                    console.error('Could not copy code: ', err);
                    showError(t('failed_to_copy_response_code'));
                });

                acceptInviteBtn.style.display = 'none';
                const responseInfo = document.createElement('p');
                responseInfo.textContent = t('response_info_paste_back');
                responseInfo.style.textAlign = 'center';
                acceptInviteBtn.parentElement?.appendChild(responseInfo);
            }
        } catch (error) {
            console.error(error);
            showError(t('failed_to_create_invitation'));
        }
    };
};

const startLocalVideo = async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
        callActions.style.display = 'flex';
        // set initial toggle labels according to current track states
        updateToggleLabels();
    } catch (error) {
        console.error(error);
        showError(t('no_media_access'));
    }
};

const closeError = () => {
    errorModal.style.display = 'none';
};

const finalizeConnection = async () => {
    try {
        const answer = JSON.parse(atob(responseCodeInput.value));
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        responseContainer.style.display = 'none';
    } catch (error) {
        console.error(error);
        showError(t('invalid_response_code'));
    }
};

const init = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');

    closeModalBtn.addEventListener('click', closeError);

    // Wait for i18n to be available, then apply translations
    const initI18n = () => {
        if ((window as any).ZeroCallI18n) {
            applyTranslations();
            onLocaleChange(() => {
                applyTranslations();
                updateToggleLabels();
            });
        } else {
            // Retry in 100ms if i18n not ready yet
            setTimeout(initI18n, 100);
        }
    };
    initI18n();

    if (inviteCode) {
        acceptInvitation(inviteCode);
    } else {
        await startLocalVideo();
        createInviteBtn.addEventListener('click', createInvitation);
        submitResponseBtn.addEventListener('click', finalizeConnection);
        micToggleBtn.addEventListener('click', toggleMic);
        camToggleBtn.addEventListener('click', toggleCam);
    }
};

const setMicLabel = (enabled: boolean) => {
    micToggleBtn.textContent = enabled ? t('mic_off') : t('mic_on');
};

const setCamLabel = (enabled: boolean) => {
    camToggleBtn.textContent = enabled ? t('cam_off') : t('cam_on');
};

const updateToggleLabels = () => {
    if (!localStream) return;
    const audioEnabled = localStream.getAudioTracks().some(tr => tr.enabled);
    const videoEnabled = localStream.getVideoTracks().some(tr => tr.enabled);
    setMicLabel(audioEnabled);
    setCamLabel(videoEnabled);
};

const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        setMicLabel(track.enabled);
    });
};

const toggleCam = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        setCamLabel(track.enabled);
    });
};

const setupSpeakingIndicator = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = dataArray.reduce((a, b) => a + b, 0);
        if (sum > 1000) {
            remoteVideo.classList.add('speaking');
        } else {
            remoteVideo.classList.remove('speaking');
        }
        requestAnimationFrame(checkSpeaking);
    };

    checkSpeaking();
};

init();
