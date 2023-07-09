var $cancelT;
export const lineMode = false;
export function pasteCancelled() {
        if ($cancelT && $cancelT > Date.now() - 50)
            return true;
        return $cancelT = false;
}
export function cancel() {
        $cancelT = Date.now();
};
